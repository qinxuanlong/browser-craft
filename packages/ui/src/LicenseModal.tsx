import { useState, type FormEvent } from "react";
import { isDevTestKey } from "@pagebox/core";
import { CheckCircleIcon, CrownIcon, KeyIcon } from "./icons";
import { useLicense } from "./useLicense";

export interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 格式化掩码显示许可证密钥，保护隐私
 */
function maskLicenseKey(key?: string): string {
  if (!key) return "未知密钥";
  if (key.length <= 8) return "********";
  return `${key.slice(0, 4)}-****-****-${key.slice(-4)}`;
}

export function LicenseModal({ isOpen, onClose }: LicenseModalProps) {
  const { isPro, licenseInfo, activating, error, setError, activate, deactivate, openCheckout } =
    useLicense();

  const [inputKey, setInputKey] = useState("");
  const [successTip, setSuccessTip] = useState("");

  if (!isOpen) return null;

  const handleActivateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessTip("");
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setError("请输入收到的 License Key 激活码");
      return;
    }

    const ok = await activate(trimmed);
    if (ok) {
      setSuccessTip(
        isDevTestKey(trimmed)
          ? "恭喜！已通过测试码快速激活 Pro 会员特权 🎉"
          : "恭喜！Pro 会员特权已成功激活 🎉"
      );
      setInputKey("");
      setTimeout(() => {
        setSuccessTip("");
      }, 3000);
    }
  };

  const handleDeactivate = async () => {
    const confirmed = window.confirm(
      "确定要解除当前设备的绑定吗？解绑后将恢复免费版，该激活额度将归还，可用于其他设备。"
    );
    if (!confirmed) return;

    await deactivate();
    setSuccessTip("已成功解除当前设备绑定");
  };

  return (
    <div className="pagebox-modal-overlay" onClick={onClose}>
      <div
        className="pagebox-modal pagebox-license-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="pagebox-modal-header">
          <div className="pagebox-license-header-title">
            <div className={`pagebox-pro-crown-badge ${isPro ? "pagebox-pro-crown-badge--active" : ""}`}>
              <CrownIcon size={18} />
            </div>
            <h2>{isPro ? "PageBox Pro 尊享会员" : "升级到 PageBox Pro"}</h2>
          </div>
          <button
            type="button"
            className="pagebox-modal-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="pagebox-modal-body pagebox-license-body">
          {isPro ? (
            /* 已激活 Pro 视图 */
            <div className="pagebox-license-pro-view">
              <div className="pagebox-license-card">
                <div className="pagebox-license-card__badge">
                  <CheckCircleIcon size={16} /> 已激活生效中
                  {isDevTestKey(licenseInfo.licenseKey) && (
                    <span style={{ fontSize: 11, opacity: 0.85, marginLeft: 4 }}>
                      [测试授权]
                    </span>
                  )}
                </div>
                <div className="pagebox-license-info-row">
                  <span className="pagebox-license-info-label">许可证密钥：</span>
                  <span className="pagebox-license-info-value pagebox-mono">
                    {maskLicenseKey(licenseInfo.licenseKey)}
                  </span>
                </div>
                {licenseInfo.customerEmail && (
                  <div className="pagebox-license-info-row">
                    <span className="pagebox-license-info-label">绑定邮箱：</span>
                    <span className="pagebox-license-info-value">
                      {licenseInfo.customerEmail}
                    </span>
                  </div>
                )}
                {licenseInfo.instanceName && (
                  <div className="pagebox-license-info-row">
                    <span className="pagebox-license-info-label">当前设备：</span>
                    <span className="pagebox-license-info-value">
                      {licenseInfo.instanceName}
                    </span>
                  </div>
                )}
              </div>

              <div className="pagebox-license-perks">
                <div className="pagebox-license-perk-item">✓ 智能重复链接检测与一键批量清理</div>
                <div className="pagebox-license-perk-item">✓ 结构化 Markdown / HTML 书签文件导出</div>
                <div className="pagebox-license-perk-item">✓ 无限层级深度分类与多维标签管理</div>
                <div className="pagebox-license-perk-item">✓ 尊享后续全量新特权与功能升级</div>
              </div>

              {successTip && (
                <div className="pagebox-license-status pagebox-license-status--success">
                  {successTip}
                </div>
              )}

              <div className="pagebox-modal-actions pagebox-license-actions">
                <button
                  type="button"
                  className="pagebox-btn pagebox-btn--outline-danger"
                  onClick={handleDeactivate}
                  disabled={activating}
                >
                  {activating ? "正在解绑..." : "解除此设备绑定"}
                </button>
                <button
                  type="button"
                  className="pagebox-btn pagebox-btn--primary"
                  onClick={onClose}
                >
                  完成
                </button>
              </div>
            </div>
          ) : (
            /* 未激活免费版视图 */
            <div className="pagebox-license-free-view">
              <p className="pagebox-license-lead">
                激活 Pro 会员，解锁进阶管理工具，告别杂乱标签与重复网页。
              </p>

              <div className="pagebox-license-perks">
                <div className="pagebox-license-perk-item">
                  <span className="pagebox-license-perk-icon">✨</span>
                  <div>
                    <strong>智能重复链接清理</strong>
                    <p>一键扫描并清理相同或冗余的标签页与书签，保持收藏库整洁。</p>
                  </div>
                </div>
                <div className="pagebox-license-perk-item">
                  <span className="pagebox-license-perk-icon">📑</span>
                  <div>
                    <strong>结构化文档高级导出</strong>
                    <p>支持将收藏列表一键导出为 Markdown 与 HTML 文档，方便知识库沉淀。</p>
                  </div>
                </div>
                <div className="pagebox-license-perk-item">
                  <span className="pagebox-license-perk-icon">🏷️</span>
                  <div>
                    <strong>多维标签 (Tags) 检索过滤</strong>
                    <p>告别单一目录树，通过灵活标签跨文件夹聚合目标网页。</p>
                  </div>
                </div>
              </div>

              <div className="pagebox-license-buy-bar">
                <button
                  type="button"
                  className="pagebox-btn pagebox-btn--buy"
                  onClick={openCheckout}
                >
                  去 Lemon Squeezy 购买 License →
                </button>
                <span className="pagebox-license-buy-hint">
                  买断终身使用 · 支持多台设备激活
                </span>
              </div>

              <hr className="pagebox-divider" />

              <form onSubmit={handleActivateSubmit} className="pagebox-license-form">
                <label className="pagebox-license-form-label" htmlFor="license-input">
                  已有激活码？在此输入激活：
                </label>
                <div className="pagebox-license-input-group">
                  <div className="pagebox-license-input-wrapper">
                    <span className="pagebox-license-input-icon">
                      <KeyIcon size={16} />
                    </span>
                    <input
                      id="license-input"
                      type="text"
                      className="pagebox-input pagebox-license-input"
                      placeholder="粘贴 License Key (本地测试可用: DEV-TEST-KEY)"
                      value={inputKey}
                      onChange={(e) => {
                        setInputKey(e.target.value);
                        if (error) setError(null);
                      }}
                      disabled={activating}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                  <button
                    type="submit"
                    className="pagebox-btn pagebox-btn--activate"
                    disabled={activating || !inputKey.trim()}
                  >
                    {activating ? "验证中..." : "激活"}
                  </button>
                </div>

                {error && (
                  <div className="pagebox-license-status pagebox-license-status--error">
                    {error}
                  </div>
                )}
                {successTip && (
                  <div className="pagebox-license-status pagebox-license-status--success">
                    {successTip}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
