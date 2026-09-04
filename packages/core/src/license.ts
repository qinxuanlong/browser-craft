import {
  LicenseService,
  type LicenseActivationResult,
  type LicenseInfo,
  type LicenseValidateResult,
} from "@workspace/shared-license";

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

export const licenseService = new LicenseService({
  appName: "PageBox",
  storageKey: LICENSE_STORAGE_KEY,
  checkoutUrl: DEFAULT_LEMON_SQUEEZY_CHECKOUT_URL,
  whitelistKeys: DEV_TEST_LICENSE_KEYS,
});

/**
 * 判断是否为本地测试白名单密钥
 */
export function isDevTestKey(key?: string): boolean {
  return licenseService.isDevTestKey(key);
}

export {
  LicenseService,
  type LicenseActivationResult,
  type LicenseInfo,
  type LicenseValidateResult,
};
