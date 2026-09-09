import type {
  LicenseActivationResult,
  LicenseInfo,
  LicenseServiceOptions,
  LicenseValidateResult,
} from "./types.js";

const DEFAULT_WHITELIST_KEYS = ["DEV-TEST-KEY", "DEV-VIP-KEY", "PAGEBOX-DEV-TEST"];

/**
 * 原生 Web Crypto SHA-256 离线哈希计算
 * 保证卡密明文永不上云，在浏览器前端即完成不可逆哈希
 */
export async function computeSHA256(text: string): Promise<string> {
  const buffer = new TextEncoder().encode(text.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 获取或生成设备唯一标识 UUID
 * 持久化保存在当前设备的 chrome.storage.local 中，防止跨设备云同步共享相同 UUID
 */
export async function getDeviceId(): Promise<string> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "device-local-fallback";
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(["device_id"], (result) => {
      if (result.device_id && typeof result.device_id === "string") {
        resolve(result.device_id);
      } else {
        const id = crypto.randomUUID();
        chrome.storage.local.set({ device_id: id }, () => resolve(id));
      }
    });
  });
}

export class LicenseService {
  readonly appId: string;
  readonly appName: string;
  readonly storageKey: string;
  checkoutUrl: string;
  apiUrl: string;
  readonly whitelistKeys: string[];

  constructor(options: LicenseServiceOptions) {
    this.appId = options.appId || (options.appName ? options.appName.toLowerCase() : "pagebox");
    this.appName = options.appName || this.appId;
    this.storageKey = options.storageKey || `${this.appId.toLowerCase()}_license`;
    this.checkoutUrl = options.checkoutUrl;
    this.apiUrl = options.apiUrl || "";
    this.whitelistKeys = (options.whitelistKeys ?? DEFAULT_WHITELIST_KEYS).map((k) =>
      k.trim().toUpperCase()
    );
  }

  /**
   * 自定义购买页面链接
   */
  setCheckoutUrl(url: string): void {
    this.checkoutUrl = url;
  }

  /**
   * 自定义 Cloudflare Worker 核销服务端地址
   */
  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * 判断是否为本地开发测试白名单密钥
   */
  isDevTestKey(key?: string): boolean {
    if (!key) return false;
    const normalized = key.trim().toUpperCase();
    return this.whitelistKeys.includes(normalized);
  }

  /**
   * 获取购买页面链接
   */
  getCheckoutUrl(): string {
    return this.checkoutUrl;
  }

  /**
   * 打开面包多或其他发卡平台的购买结账页面
   */
  async openCheckout(): Promise<void> {
    const url = this.getCheckoutUrl();
    if (!url) return;
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      await chrome.tabs.create({ url });
    } else if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  /**
   * 获取当前本地持久化的许可证信息
   * 优先读取 chrome.storage.sync，降级读取 chrome.storage.local
   */
  async getLicenseInfo(): Promise<LicenseInfo> {
    try {
      if (typeof chrome === "undefined" || (!chrome.storage?.sync && !chrome.storage?.local)) {
        return { isPro: false };
      }

      // 1. 尝试从 chrome.storage.sync 获取
      if (chrome.storage.sync) {
        const syncRes = await new Promise<Record<string, unknown>>((resolve) => {
          chrome.storage.sync.get([this.storageKey, "isPro", "proHash"], (res) => resolve(res || {}));
        });

        const syncInfo = syncRes[this.storageKey] as LicenseInfo | undefined;
        if (syncInfo && syncInfo.isPro) {
          return syncInfo;
        }

        // 兼容单字段存储模式
        if (syncRes.isPro) {
          return {
            isPro: true,
            proHash: typeof syncRes.proHash === "string" ? syncRes.proHash : undefined,
          };
        }
      }

      // 2. 降级从 chrome.storage.local 获取
      if (chrome.storage.local) {
        const localRes = await new Promise<Record<string, unknown>>((resolve) => {
          chrome.storage.local.get([this.storageKey], (res) => resolve(res || {}));
        });
        const localInfo = localRes[this.storageKey] as LicenseInfo | undefined;
        if (localInfo) {
          return localInfo;
        }
      }

      return { isPro: false };
    } catch {
      return { isPro: false };
    }
  }

  /**
   * 保存许可证信息至持久化存储（同时写入 sync 与 local）
   */
  private async saveLicenseInfo(info: LicenseInfo): Promise<void> {
    if (typeof chrome === "undefined") return;

    const data = {
      [this.storageKey]: info,
      isPro: info.isPro,
      proHash: info.proHash,
    };

    if (chrome.storage.sync) {
      try {
        await new Promise<void>((resolve, reject) => {
          chrome.storage.sync.set(data, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      } catch {
        // sync 写入失败时忽略，继续依靠 local
      }
    }

    if (chrome.storage.local) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set(data, () => resolve());
      });
    }
  }

  /**
   * 提交激活卡密
   * 1. 本地 Web Crypto 计算不可逆 SHA-256 哈希
   * 2. 获取当前设备唯一 UUID
   * 3. 提交至 Cloudflare Worker 边缘节点校验与设备绑定
   */
  async activate(rawKey: string): Promise<LicenseActivationResult> {
    const licenseKey = rawKey.trim();
    if (!licenseKey) {
      return { success: false, error: "请输入有效的卡密" };
    }

    const deviceId = await getDeviceId();
    const shortDeviceId = deviceId.slice(0, 8).toUpperCase();

    // 1. 本地白名单快捷模拟激活（用于离线开发与自动化测试）
    if (this.isDevTestKey(licenseKey)) {
      const devHash = await computeSHA256(licenseKey);
      const devInfo: LicenseInfo = {
        isPro: true,
        licenseKey: licenseKey.toUpperCase(),
        proHash: devHash,
        deviceId: deviceId,
        instanceName: `测试设备-${shortDeviceId}`,
        activatedAt: Date.now(),
        lastValidatedAt: Date.now(),
        expiresAt: null,
      };

      await this.saveLicenseInfo(devInfo);
      return { success: true, message: "本地测试激活成功", licenseInfo: devInfo };
    }

    // 2. 正式向 Cloudflare Worker 发起核销请求
    const isPlaceholderUrl =
      !this.apiUrl ||
      this.apiUrl === "https://pagebox-license-worker.workers.dev" ||
      this.apiUrl.includes("<your-subdomain>") ||
      this.apiUrl.includes("<USER>");

    if (isPlaceholderUrl) {
      return {
        success: false,
        error:
          "尚未配置真实 Cloudflare Worker 域名（当前为默认占位地址）。请先在 packages/core/src/license.ts 中填入您部署的实际 Worker 地址，或在界面输入测试码 DEV-TEST-KEY 离线体验。",
      };
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutTimer = controller ? setTimeout(() => controller.abort(), 8000) : null;

    try {
      const hash = await computeSHA256(licenseKey);

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller?.signal,
        body: JSON.stringify({
          app_id: this.appId,
          hash: hash,
          device_id: deviceId,
        }),
      });

      const result = (await response.json()) as { valid?: boolean; message?: string };

      if (response.ok && result.valid) {
        const info: LicenseInfo = {
          isPro: true,
          licenseKey: licenseKey,
          proHash: hash,
          deviceId: deviceId,
          instanceName: `设备-${shortDeviceId}`,
          activatedAt: Date.now(),
          lastValidatedAt: Date.now(),
          expiresAt: null,
        };

        await this.saveLicenseInfo(info);
        return { success: true, message: result.message || "激活成功", licenseInfo: info };
      }

      return {
        success: false,
        error: result.message || "卡密无效或核销失败",
      };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const detail = isAbort
        ? "请求超时（8 秒无响应，请检查 Worker 服务是否正常运行）"
        : err instanceof Error
        ? err.message
        : "网络连接异常";
      return {
        success: false,
        error: `连接 Worker 核销接口失败: ${detail}。请核对 Worker 域名是否已正确部署上线。`,
      };
    } finally {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
    }
  }

  /**
   * 校验许可证有效性（支持时间缓存，避免高频调用）
   */
  async validate(force = false): Promise<LicenseValidateResult> {
    const current = await this.getLicenseInfo();
    if (!current.isPro || !current.proHash) {
      return { valid: false, error: "未激活" };
    }

    if (this.isDevTestKey(current.licenseKey)) {
      return { valid: true, licenseInfo: current };
    }

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (!force && current.lastValidatedAt && now - current.lastValidatedAt < ONE_DAY_MS) {
      return { valid: true, licenseInfo: current };
    }

    if (!this.apiUrl) {
      return { valid: true, licenseInfo: current };
    }

    try {
      const deviceId = current.deviceId || (await getDeviceId());
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: this.appId,
          hash: current.proHash,
          device_id: deviceId,
        }),
      });

      const data = (await response.json()) as { valid?: boolean; message?: string };

      if (response.ok && data.valid) {
        const updated: LicenseInfo = {
          ...current,
          lastValidatedAt: Date.now(),
        };
        await this.saveLicenseInfo(updated);
        return { valid: true, licenseInfo: updated };
      }

      // 如果远端明确返回失效（例如被禁用），清除本地 Pro 状态
      const revoked: LicenseInfo = {
        isPro: false,
        licenseKey: current.licenseKey,
      };
      await this.saveLicenseInfo(revoked);

      return {
        valid: false,
        error: data.message || "卡密已失效或绑定冲突",
        licenseInfo: revoked,
      };
    } catch {
      // 网络抖动时不剥夺用户当前离线权限，保持放行
      return { valid: true, licenseInfo: current };
    }
  }

  /**
   * 清除本地 Pro 状态与卡密凭据
   */
  async deactivate(): Promise<{ success: boolean; error?: string }> {
    if (typeof chrome !== "undefined") {
      if (chrome.storage.sync) {
        await new Promise<void>((resolve) => {
          chrome.storage.sync.remove([this.storageKey, "isPro", "proHash"], () => resolve());
        });
      }
      if (chrome.storage.local) {
        await new Promise<void>((resolve) => {
          chrome.storage.local.remove([this.storageKey, "isPro", "proHash"], () => resolve());
        });
      }
    }

    return { success: true };
  }

  /**
   * 监听许可证状态变化，实现多视图（Popup/SidePanel/Manager）秒级响应
   */
  subscribe(callback: (info: LicenseInfo) => void): () => void {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {};
    }

    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if ((areaName === "sync" || areaName === "local") && changes[this.storageKey]) {
        const newValue = (changes[this.storageKey].newValue as LicenseInfo) ?? {
          isPro: false,
        };
        callback(newValue);
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }
}

export function createLicenseService(options: LicenseServiceOptions): LicenseService {
  return new LicenseService(options);
}
