import type {
  LicenseActivationResult,
  LicenseInfo,
  LicenseServiceOptions,
  LicenseValidateResult,
} from "./types.js";

const DEFAULT_API_BASE = "https://api.lemonsqueezy.com/v1/licenses";
const DEFAULT_WHITELIST_KEYS = [
  "DEV-TEST-KEY",
  "DEV-VIP-KEY",
];

export class LicenseService {
  readonly appName: string;
  readonly storageKey: string;
  checkoutUrl: string;
  readonly whitelistKeys: string[];
  readonly apiBase: string;

  /**
   * 自定义购买页面链接
   */
  setCheckoutUrl(url: string): void {
    this.checkoutUrl = url;
  }

  constructor(options: LicenseServiceOptions) {
    this.appName = options.appName;
    this.storageKey = options.storageKey || `${options.appName.toLowerCase()}_license`;
    this.checkoutUrl = options.checkoutUrl;
    this.whitelistKeys = (options.whitelistKeys ?? DEFAULT_WHITELIST_KEYS).map((k) =>
      k.trim().toUpperCase()
    );
    this.apiBase = options.apiBase || DEFAULT_API_BASE;
  }

  /**
   * 判断是否为本地测试白名单密钥
   */
  isDevTestKey(key?: string): boolean {
    if (!key) return false;
    const normalized = key.trim().toUpperCase();
    return this.whitelistKeys.includes(normalized);
  }

  /**
   * 生成当前浏览器的设备实例名称
   */
  createInstanceName(): string {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
    let browser = "Chrome";
    if (ua.includes("Edg/")) {
      browser = "Edge";
    } else if (ua.includes("Firefox/")) {
      browser = "Firefox";
    } else if (ua.includes("Brave")) {
      browser = "Brave";
    }
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${this.appName}_${browser}_${randomSuffix}`;
  }

  /**
   * 获取购买页面链接
   */
  getCheckoutUrl(): string {
    return this.checkoutUrl;
  }

  /**
   * 打开 Lemon Squeezy 购买结账页面
   */
  async openCheckout(): Promise<void> {
    const url = this.getCheckoutUrl();
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      await chrome.tabs.create({ url });
    } else if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  /**
   * 获取当前本地持久化的许可证信息
   */
  async getLicenseInfo(): Promise<LicenseInfo> {
    try {
      if (typeof chrome === "undefined" || !chrome.storage?.local) {
        return { isPro: false };
      }
      const res = await chrome.storage.local.get(this.storageKey);
      const info = res[this.storageKey] as LicenseInfo | undefined;
      return info ?? { isPro: false };
    } catch (err) {
      console.error(`[${this.appName}] 读取许可证信息失败:`, err);
      return { isPro: false };
    }
  }

  /**
   * 调用 Lemon Squeezy 官方接口激活许可证
   */
  async activate(rawKey: string): Promise<LicenseActivationResult> {
    const licenseKey = rawKey.trim();
    if (!licenseKey) {
      return { success: false, error: "请输入有效的许可证激活码" };
    }

    const instanceName = this.createInstanceName();

    // 如果是本地开发测试白名单密钥，直接在本地完成模拟激活，无需请求网络
    if (this.isDevTestKey(licenseKey)) {
      const devInfo: LicenseInfo = {
        isPro: true,
        licenseKey: licenseKey.toUpperCase(),
        instanceId: "dev-test-instance",
        instanceName: `${instanceName}_DEV`,
        customerName: `${this.appName} Developer (测试用户)`,
        customerEmail: "developer@test.local",
        activatedAt: Date.now(),
        lastValidatedAt: Date.now(),
        expiresAt: null, // 永久授权
      };

      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.set({ [this.storageKey]: devInfo });
      }

      return { success: true, licenseInfo: devInfo };
    }

    try {
      const response = await fetch(`${this.apiBase}/activate`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          license_key: licenseKey,
          instance_name: instanceName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.activated) {
        const info: LicenseInfo = {
          isPro: true,
          licenseKey: data.license_key?.key || licenseKey,
          instanceId: data.instance?.id || "",
          instanceName: data.instance?.name || instanceName,
          customerName: data.meta?.user_name || undefined,
          customerEmail: data.meta?.user_email || undefined,
          activatedAt: Date.now(),
          lastValidatedAt: Date.now(),
          expiresAt: data.license_key?.expires_at
            ? new Date(data.license_key.expires_at).getTime()
            : null,
        };

        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          await chrome.storage.local.set({ [this.storageKey]: info });
        }

        return { success: true, licenseInfo: info };
      }

      const errorMessage =
        data.error ||
        data.message ||
        "激活失败，激活码无效或已达设备上限";
      return { success: false, error: errorMessage };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "网络连接异常，请检查网络后重试";
      return { success: false, error: `激活请求失败: ${message}` };
    }
  }

  /**
   * 校验许可证有效性（支持时间缓存，避免高频调用）
   */
  async validate(force = false): Promise<LicenseValidateResult> {
    const current = await this.getLicenseInfo();
    if (!current.isPro || !current.licenseKey) {
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

    try {
      const params: Record<string, string> = {
        license_key: current.licenseKey,
      };
      if (current.instanceId) {
        params.instance_id = current.instanceId;
      }

      const response = await fetch(`${this.apiBase}/validate`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        const updated: LicenseInfo = {
          ...current,
          lastValidatedAt: Date.now(),
          expiresAt: data.license_key?.expires_at
            ? new Date(data.license_key.expires_at).getTime()
            : current.expiresAt,
        };
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          await chrome.storage.local.set({ [this.storageKey]: updated });
        }
        return { valid: true, licenseInfo: updated };
      }

      const revoked: LicenseInfo = {
        isPro: false,
        licenseKey: current.licenseKey,
        customerEmail: current.customerEmail,
      };
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.set({ [this.storageKey]: revoked });
      }

      return {
        valid: false,
        error: data.error || "许可证已失效或已过期",
        licenseInfo: revoked,
      };
    } catch {
      return { valid: true, licenseInfo: current };
    }
  }

  /**
   * 解除当前设备绑定并清除本地 Pro 状态
   */
  async deactivate(): Promise<{ success: boolean; error?: string }> {
    const current = await this.getLicenseInfo();
    const { licenseKey, instanceId } = current;

    if (licenseKey && instanceId && !this.isDevTestKey(licenseKey)) {
      try {
        await fetch(`${this.apiBase}/deactivate`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            license_key: licenseKey,
            instance_id: instanceId,
          }),
        });
      } catch (err) {
        console.warn(`[${this.appName}] Lemon Squeezy 远端解绑请求失败（忽略并继续清除本地凭据）:`, err);
      }
    }

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.remove(this.storageKey);
    }

    return { success: true };
  }

  /**
   * 监听许可证状态变化
   */
  subscribe(callback: (info: LicenseInfo) => void): () => void {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {};
    }

    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes[this.storageKey]) {
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
