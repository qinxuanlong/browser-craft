import React from "react";
import { TocItem } from "../../types";

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
          <span className="toc-title">📖 章节与目录大纲</span>
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
                <span className="toc-text">{item.text || "无标题小节"}</span>
              </div>
            ))
          ) : (
            <div className="toc-empty-hint">当前文档暂未提取到标题</div>
          )}
        </div>
      </div>
    </div>
  );
};
