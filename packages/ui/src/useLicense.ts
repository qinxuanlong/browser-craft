import type { LicenseInfo } from "@pagebox/types";

/**
 * 许可证状态管理 React Hook
 * 当前所有高级治理功能已完全免费开放，默认赋予全部特权
 */
export function useLicense() {
  const licenseInfo: LicenseInfo = { isPro: true };

  return {
    isPro: true,
    licenseInfo,
    loading: false,
    activating: false,
    error: null,
    setError: () => {},
    activate: async () => true,
    deactivate: async () => true,
    openCheckout: () => {},
    refresh: async () => {},
  };
}
