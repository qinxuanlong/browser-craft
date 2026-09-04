import type {
  LicenseActivationResult,
  LicenseInfo,
  LicenseValidateResult,
} from "@pagebox/types";

/**
 * Lemon Squeezy 本地存储 Key
 */
export const LICENSE_STORAGE_KEY = "pagebox_license";

/**
 * 默认的购买结账链接
 * 提示：将下面的 URL 替换为你在 Lemon Squeezy 后台创建的实际 Checkout Link
 * 例如：https://your-store.lemonsqueezy.com/buy/xxxxxx
 */
export const DEFAULT_LEMON_SQUEEZY_CHECKOUT_URL =
  "https://pagebox-app.lemonsqueezy.com/checkout/buy/ccd9e07c-e50a-42df-9bee-e3c29eef4512";

/**
 * 本地开发与联调测试白名单激活码（不区分大小写）
 * 在此列表中的 Key 无需走 Lemon Squeezy 网络请求，直接在本地完成 Pro 模拟激活
 */
export const DEV_TEST_LICENSE_KEYS = [
  "DEV-TEST-KEY",
  "PAGEBOX-DEV-TEST",
  "PAGEBOX-PRO-VIP",
];

/**
 * 判断是否为本地测试白名单密钥
 */
export function isDevTestKey(key?: string): boolean {
  if (!key) return false;
  const normalized = key.trim().toUpperCase();
  return DEV_TEST_LICENSE_KEYS.includes(normalized);
}

const API_BASE = "https://api.lemonsqueezy.com/v1/licenses";

/**
 * 生成当前浏览器的设备实例名称
 */
function createInstanceName(): string {
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
  return `PageBox_${browser}_${randomSuffix}`;
}

export class LicenseService {
  private checkoutUrl: string = DEFAULT_LEMON_SQUEEZY_CHECKOUT_URL;

  /**
   * 自定义购买页面链接
   */
  setCheckoutUrl(url: string): void {
    this.checkoutUrl = url;
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
      const res = await chrome.storage.local.get(LICENSE_STORAGE_KEY);
      const info = res[LICENSE_STORAGE_KEY] as LicenseInfo | undefined;
      return info ?? { isPro: false };
    } catch (err) {
      console.error("读取许可证信息失败:", err);
      return { isPro: false };
    }
  }

  /**
   * 调用 Lemon Squeezy 官方接口激活许可证
   * @param rawKey 用户输入的激活码
   */
  async activate(rawKey: string): Promise<LicenseActivationResult> {
    const licenseKey = rawKey.trim();
    if (!licenseKey) {
      return { success: false, error: "请输入有效的许可证激活码" };
    }

    const instanceName = createInstanceName();

    // 如果是本地开发测试白名单密钥，直接在本地完成模拟激活，无需请求网络
    if (isDevTestKey(licenseKey)) {
      const devInfo: LicenseInfo = {
        isPro: true,
        licenseKey: licenseKey.toUpperCase(),
        instanceId: "dev-test-instance",
        instanceName: `${instanceName}_DEV`,
        customerName: "PageBox Developer (测试用户)",
        customerEmail: "developer@pagebox.dev",
        activatedAt: Date.now(),
        lastValidatedAt: Date.now(),
        expiresAt: null, // 永久授权
      };

      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: devInfo });
      }

      return { success: true, licenseInfo: devInfo };
    }

    try {
      const response = await fetch(`${API_BASE}/activate`, {
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

        // 持久化到 chrome.storage.local
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          await chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: info });
        }

        return { success: true, licenseInfo: info };
      }

      // 提取错误原因
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
   * @param force 是否强制发起网络校验
   */
  async validate(force = false): Promise<LicenseValidateResult> {
    const current = await this.getLicenseInfo();
    if (!current.isPro || !current.licenseKey) {
      return { valid: false, error: "未激活" };
    }

    // 本地开发测试激活码，永久有效，不向远端验证
    if (isDevTestKey(current.licenseKey)) {
      return { valid: true, licenseInfo: current };
    }

    // 默认 24 小时内无需重复网络验证，保证极速离线体验
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

      const response = await fetch(`${API_BASE}/validate`, {
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
          await chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: updated });
        }
        return { valid: true, licenseInfo: updated };
      }

      // 许可证已过期或失效，自动降级为非 Pro 状态
      const revoked: LicenseInfo = {
        isPro: false,
        licenseKey: current.licenseKey,
        customerEmail: current.customerEmail,
      };
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: revoked });
      }

      return {
        valid: false,
        error: data.error || "许可证已失效或已过期",
        licenseInfo: revoked,
      };
    } catch (err) {
      // 网络故障时，宽容处理保持现有离线 Pro 状态，不影响离线使用
      return { valid: true, licenseInfo: current };
    }
  }

  /**
   * 解除当前设备绑定并清除本地 Pro 状态
   */
  async deactivate(): Promise<{ success: boolean; error?: string }> {
    const current = await this.getLicenseInfo();
    const { licenseKey, instanceId } = current;

    // 非测试激活码才向远端发起解绑
    if (licenseKey && instanceId && !isDevTestKey(licenseKey)) {
      try {
        await fetch(`${API_BASE}/deactivate`, {
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
        console.warn("Lemon Squeezy 远端解绑请求失败（忽略并继续清除本地凭据）:", err);
      }
    }

    // 清除本地存储
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.remove(LICENSE_STORAGE_KEY);
    }

    return { success: true };
  }

  /**
   * 监听许可证状态变化（支持 Popup / SidePanel / ManagerApp 跨页面实时联动）
   */
  subscribe(callback: (info: LicenseInfo) => void): () => void {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {};
    }

    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes[LICENSE_STORAGE_KEY]) {
        const newValue = (changes[LICENSE_STORAGE_KEY].newValue as LicenseInfo) ?? {
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

export const licenseService = new LicenseService();
