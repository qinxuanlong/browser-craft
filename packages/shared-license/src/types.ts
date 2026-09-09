/** 卡密授权状态 */
export type LicenseStatus = "active" | "inactive" | "expired" | "disabled";

/** 本地存储的许可证凭据信息 */
export interface LicenseInfo {
  /** 是否拥有 Pro 特权 */
  isPro: boolean;
  /** 激活的卡密明文（仅保存在用户本地浏览器存储中，明文永不上云） */
  licenseKey?: string;
  /** 卡密经 Web Crypto 原生 SHA-256 计算后的不可逆哈希值 */
  proHash?: string;
  /** 当前设备唯一标识 UUID */
  deviceId?: string;
  /** 设备实例标识名称（可供界面友好显示） */
  instanceName?: string;
  /** 购买者邮箱（可选） */
  customerEmail?: string;
  /** 激活时间戳 */
  activatedAt?: number;
  /** 上次校验时间戳 */
  lastValidatedAt?: number;
  /** 到期时间戳（买断制通常为 null） */
  expiresAt?: number | null;
}

/** 激活操作响应结果 */
export interface LicenseActivationResult {
  success: boolean;
  error?: string;
  message?: string;
  licenseInfo?: LicenseInfo;
}

/** 校验操作响应结果 */
export interface LicenseValidateResult {
  valid: boolean;
  error?: string;
  message?: string;
  licenseInfo?: LicenseInfo;
}

/** 许可证服务配置选项 */
export interface LicenseServiceOptions {
  /** 应用唯一标识 (如 'pagebox', 'tree_reader', 'all_access_bundle') */
  appId?: string;
  /** 兼容别名 appName */
  appName?: string;
  /** Cloudflare Worker 边缘核销服务接口地址 */
  apiUrl?: string;
  /** 面包多等卡密发卡平台结账购买链接 */
  checkoutUrl: string;
  /** 本地存储 key 名称（默认为 `${appId.toLowerCase()}_license`） */
  storageKey?: string;
  /** 本地开发测试白名单密钥（不区分大小写，无需网络请求直接激活） */
  whitelistKeys?: string[];
}
