import React from "react";
import { useTranslation } from "./i18n";

export interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const getSponsorImageUrl = (): string => {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    try {
      return chrome.runtime.getURL("sponsor.jpg");
    } catch {
      return "/sponsor.jpg";
    }
  }
  return "/sponsor.jpg";
};

export const SponsorModal: React.FC<SponsorModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="pagebox-modal-overlay" onClick={onClose}>
      <div
        className="pagebox-modal pagebox-sponsor-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="pagebox-modal-header">
          <div className="pagebox-sponsor-modal__header-title">
            <span className="pagebox-sponsor-icon">☕</span>
            <h2>{t.settings.sponsorTitle}</h2>
          </div>
          <button
            type="button"
            className="pagebox-modal-close"
            onClick={onClose}
            aria-label={t.common.close}
          >
            ✕
          </button>
        </div>

        <div className="pagebox-modal-body pagebox-sponsor-body">
          <p className="pagebox-sponsor-desc">
            {t.settings.sponsorDesc}
          </p>

          <div className="pagebox-sponsor-card">
            <img
              src={getSponsorImageUrl()}
              alt="微信赞赏码"
              className="pagebox-sponsor-qrcode-img"
            />
            <div className="pagebox-sponsor-badge-tag">
              <span>{t.settings.sponsorScanTip}</span>
            </div>
            <p className="pagebox-sponsor-quote">
              “感谢请作者喝咖啡，祝使用愉快！”
            </p>
          </div>

          <div className="pagebox-modal-actions pagebox-sponsor-actions">
            <button
              type="button"
              className="pagebox-btn pagebox-btn--primary"
              onClick={onClose}
            >
              {t.common.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
