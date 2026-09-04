import { useCallback, useEffect, useState } from "react";
import { licenseService } from "@pagebox/core";
import type { LicenseInfo } from "@pagebox/types";

/**
 * 许可证与 Pro 会员状态管理 React Hook
 */
export function useLicense() {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({ isPro: false });
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const info = await licenseService.getLicenseInfo();
    setLicenseInfo(info);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    // 后台尝试静默校验（具有 24h 缓存防抖，不阻塞界面）
    void licenseService.validate();

    // 订阅 storage 变更，实现 Popup / SidePanel / Manager 跨页面秒级同步
    const unsubscribe = licenseService.subscribe((newInfo) => {
      setLicenseInfo(newInfo);
    });
    return () => unsubscribe();
  }, [refresh]);

  /**
   * 激活输入的 License Key
   */
  const activate = async (rawKey: string): Promise<boolean> => {
    setActivating(true);
    setError(null);
    try {
      const res = await licenseService.activate(rawKey);
      if (res.success && res.licenseInfo) {
        setLicenseInfo(res.licenseInfo);
        return true;
      }
      setError(res.error || "激活失败，请核对激活码");
      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "网络连接异常";
      setError(msg);
      return false;
    } finally {
      setActivating(false);
    }
  };

  /**
   * 解除当前设备绑定
   */
  const deactivate = async (): Promise<boolean> => {
    setActivating(true);
    setError(null);
    try {
      await licenseService.deactivate();
      setLicenseInfo({ isPro: false });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "解绑失败";
      setError(msg);
      return false;
    } finally {
      setActivating(false);
    }
  };

  /**
   * 打开 Lemon Squeezy 购买页面
   */
  const openCheckout = () => {
    void licenseService.openCheckout();
  };

  return {
    isPro: Boolean(licenseInfo.isPro),
    licenseInfo,
    loading,
    activating,
    error,
    setError,
    activate,
    deactivate,
    openCheckout,
    refresh,
  };
}
