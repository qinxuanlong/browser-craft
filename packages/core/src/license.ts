import type {
  LicenseActivationResult,
  LicenseInfo,
  LicenseValidateResult,
} from "@pagebox/types";

/**
 * 许可证服务（全功能免费开放模式）
 */
export const licenseService = {
  appName: "PageBox",
  appId: "pagebox",
  isDevTestKey: (_key?: string) => true,
  getCheckoutUrl: () => "",
  openCheckout: async () => {},
  getLicenseInfo: async (): Promise<LicenseInfo> => ({ isPro: true }),
  activate: async (): Promise<LicenseActivationResult> => ({
    success: true,
    licenseInfo: { isPro: true },
  }),
  validate: async (): Promise<LicenseValidateResult> => ({
    valid: true,
    licenseInfo: { isPro: true },
  }),
  deactivate: async () => ({ success: true }),
  subscribe: (_callback: (info: LicenseInfo) => void) => () => {},
};

export function isDevTestKey(_key?: string): boolean {
  return true;
}

export type {
  LicenseActivationResult,
  LicenseInfo,
  LicenseValidateResult,
};
