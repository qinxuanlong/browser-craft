import React from "react";
import { TocItem } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";

interface TocDrawerProps {
  isOpen: boolean;
  tocList: TocItem[];
  onClose: () => void;
}

export const TocDrawer: React.FC<TocDrawerProps> = ({
  isOpen,
  tocList,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      onClose();
    }
  };

  return (
    <div className="toc-drawer-overlay" onClick={onClose}>
      <div
        className="toc-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="toc-drawer-header">
          <span className="toc-title">{t.toc.title}</span>
          <button type="button" className="toc-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="toc-items-list">
          {tocList.length > 0 ? (
            tocList.map((item) => (
              <div
                key={item.id}
                className={`toc-item-row toc-level-${item.level}`}
                onClick={() => scrollToHeading(item.id)}
              >
                <span className="toc-level-indicator">{"•".repeat(Math.min(item.level, 3))}</span>
                <span className="toc-text">{item.text || t.toc.untitled}</span>
              </div>
            ))
          ) : (
            <div className="toc-empty-hint">{t.toc.empty}</div>
          )}
        </div>
      </div>
    </div>
  );
};
