/** Lemon Squeezy 许可证状态 */
export type LicenseStatus = "active" | "inactive" | "expired" | "disabled";

/** 本地存储的许可证凭据信息 */
export interface LicenseInfo {
  /** 是否拥有 Pro 特权 */
  isPro: boolean;
  /** 激活的许可证密钥 */
  licenseKey?: string;
  /** 当前设备实例 ID（Lemon Squeezy 生成） */
  instanceId?: string;
  /** 设备实例名称 */
  instanceName?: string;
  /** 购买者姓名 */
  customerName?: string;
  /** 购买者邮箱 */
  customerEmail?: string;
  /** 激活时间戳 */
  activatedAt?: number;
  /** 上次校验时间戳 */
  lastValidatedAt?: number;
  /** 到期时间戳（订阅制时有值，买断制通常为 null） */
  expiresAt?: number | null;
}

/** 激活操作响应结果 */
export interface LicenseActivationResult {
  success: boolean;
  error?: string;
  licenseInfo?: LicenseInfo;
}

/** 校验操作响应结果 */
export interface LicenseValidateResult {
  valid: boolean;
  error?: string;
  licenseInfo?: LicenseInfo;
}

/** 许可证服务配置选项 */
export interface LicenseServiceOptions {
  /** 应用或插件标识（如 PageBox） */
  appName: string;
  /** 本地存储 key 名称（默认为 `${appName.toLowerCase()}_license`） */
  storageKey?: string;
  /** Lemon Squeezy 结账购买链接 */
  checkoutUrl: string;
  /** 本地开发测试白名单密钥（不区分大小写，无需网络请求直接激活） */
  whitelistKeys?: string[];
  /** Lemon Squeezy API 地址（默认 https://api.lemonsqueezy.com/v1/licenses） */
  apiBase?: string;
}
