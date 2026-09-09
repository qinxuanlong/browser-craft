import {
  LicenseService,
  type LicenseActivationResult,
  type LicenseInfo,
  type LicenseValidateResult,
} from "@workspace/shared-license";

/**
 * 许可证本地存储 Key
 */
export const LICENSE_STORAGE_KEY = "pagebox_license";

/**
 * Cloudflare Worker 边缘核销服务地址
 * 提示：替换为您实际部署的 Cloudflare Worker 终端域名，例如：https://pagebox-license-worker.your-subdomain.workers.dev
 */
export const DEFAULT_LICENSE_WORKER_URL = "https://license-auth.1470681411.workers.dev";

/**
 * 默认的面包多卡密购买链接
 * 提示：替换为你在面包多发布的卡密商品短链接（例如：https://mbd.pub/o/bread/xxxx）
 */
export const DEFAULT_CHECKOUT_URL = "https://mbd.pub/o/bread/pagebox-pro";

/**
 * 本地开发与联调测试白名单激活码（不区分大小写）
 * 在此列表中的 Key 无需网络请求，直接在本地完成 Pro 模拟激活
 */
export const DEV_TEST_LICENSE_KEYS = [
  "DEV-TEST-KEY",
  "PAGEBOX-DEV-TEST",
  "PAGEBOX-PRO-VIP",
];

export const licenseService = new LicenseService({
  appId: "pagebox",
  appName: "PageBox",
  apiUrl: DEFAULT_LICENSE_WORKER_URL,
  checkoutUrl: DEFAULT_CHECKOUT_URL,
  storageKey: LICENSE_STORAGE_KEY,
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
