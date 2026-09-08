import { useState, type FormEvent } from "react";
import { isDevTestKey } from "@pagebox/core";
import { CheckCircleIcon, CrownIcon, KeyIcon } from "./icons";
import { useLicense } from "./useLicense";
import { useTranslation } from "./i18n";

export interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 格式化掩码显示许可证密钥，保护隐私
 */
function maskLicenseKey(key?: string, unknownText = "未知密钥"): string {
  if (!key) return unknownText;
  if (key.length <= 8) return "********";
  return `${key.slice(0, 4)}-****-****-${key.slice(-4)}`;
}

export function LicenseModal({ isOpen, onClose }: LicenseModalProps) {
  const { t } = useTranslation();
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
      setError(t.license.emptyKeyError);
      return;
    }

    const ok = await activate(trimmed);
    if (ok) {
      setSuccessTip(
        isDevTestKey(trimmed)
          ? t.license.testActivateSuccess
          : t.license.activateSuccess,
      );
      setInputKey("");
      setTimeout(() => {
        setSuccessTip("");
      }, 3000);
    }
  };

  const handleDeactivate = async () => {
    const confirmed = window.confirm(t.license.deactivateConfirm);
    if (!confirmed) return;

    await deactivate();
    setSuccessTip(t.license.deactivateSuccess);
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
            <h2>{isPro ? t.license.proTitleActive : t.license.proTitleUpgrade}</h2>
          </div>
          <button
            type="button"
            className="pagebox-modal-close"
            onClick={onClose}
            aria-label={t.license.close}
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
                  <CheckCircleIcon size={16} /> {t.license.activeBadge}
                  {isDevTestKey(licenseInfo.licenseKey) && (
                    <span style={{ fontSize: 11, opacity: 0.85, marginLeft: 4 }}>
                      {t.license.testLicense}
                    </span>
                  )}
                </div>
                <div className="pagebox-license-info-row">
                  <span className="pagebox-license-info-label">{t.license.licenseKeyLabel}</span>
                  <span className="pagebox-license-info-value pagebox-mono">
                    {maskLicenseKey(licenseInfo.licenseKey, t.license.unknownKey)}
                  </span>
                </div>
                {licenseInfo.customerEmail && (
                  <div className="pagebox-license-info-row">
                    <span className="pagebox-license-info-label">{t.license.boundEmailLabel}</span>
                    <span className="pagebox-license-info-value">
                      {licenseInfo.customerEmail}
                    </span>
                  </div>
                )}
                {licenseInfo.instanceName && (
                  <div className="pagebox-license-info-row">
                    <span className="pagebox-license-info-label">{t.license.currentDeviceLabel}</span>
                    <span className="pagebox-license-info-value">
                      {licenseInfo.instanceName}
                    </span>
                  </div>
                )}
              </div>

              <div className="pagebox-license-perks">
                <div className="pagebox-license-perk-item">{t.license.perk1}</div>
                <div className="pagebox-license-perk-item">{t.license.perk2}</div>
                <div className="pagebox-license-perk-item">{t.license.perk3}</div>
                <div className="pagebox-license-perk-item">{t.license.perk4}</div>
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
                  {activating ? t.license.deactivating : t.license.deactivateBtn}
                </button>
                <button
                  type="button"
                  className="pagebox-btn pagebox-btn--primary"
                  onClick={onClose}
                >
                  {t.license.doneBtn}
                </button>
              </div>
            </div>
          ) : (
            /* 未激活免费版视图 */
            <div className="pagebox-license-free-view">
              <p className="pagebox-license-lead">
                {t.license.leadText}
              </p>

              <div className="pagebox-license-perks">
                <div className="pagebox-license-perk-item">
                  <span className="pagebox-license-perk-icon">✨</span>
                  <div>
                    <strong>{t.license.feature1Title}</strong>
                    <p>{t.license.feature1Desc}</p>
                  </div>
                </div>
                <div className="pagebox-license-perk-item">
                  <span className="pagebox-license-perk-icon">📑</span>
                  <div>
                    <strong>{t.license.feature2Title}</strong>
                    <p>{t.license.feature2Desc}</p>
                  </div>
                </div>
                <div className="pagebox-license-perk-item">
                  <span className="pagebox-license-perk-icon">🏷️</span>
                  <div>
                    <strong>{t.license.feature3Title}</strong>
                    <p>{t.license.feature3Desc}</p>
                  </div>
                </div>
              </div>

              <div className="pagebox-license-buy-bar">
                <button
                  type="button"
                  className="pagebox-btn pagebox-btn--buy"
                  onClick={openCheckout}
                >
                  {t.license.buyBtn}
                </button>
                <span className="pagebox-license-buy-hint">
                  {t.license.buyHint}
                </span>
              </div>

              <hr className="pagebox-divider" />

              <form onSubmit={handleActivateSubmit} className="pagebox-license-form">
                <label className="pagebox-license-form-label" htmlFor="license-input">
                  {t.license.hasKeyLabel}
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
                      placeholder={t.license.placeholder}
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
                    {activating ? t.license.validating : t.license.activateBtn}
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
