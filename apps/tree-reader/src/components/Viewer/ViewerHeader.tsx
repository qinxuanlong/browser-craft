import React, { useState } from "react";
import { ViewMode, SaveStatus } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
import {
  CollapseSidebarIcon,
  MenuIcon,
  CopyIcon,
  CheckIcon,
  EditIcon,
  EyeIcon,
  SaveIcon,
  GlobeIcon,
} from "../Icons";

interface ViewerHeaderProps {
  isSidebarCollapsed: boolean;
  viewMode: ViewMode;
  showLineNumbers: boolean;
  wordWrap: boolean;
  fontSize: number;
  hasToc: boolean;
  isTocOpen: boolean;
  currentContent: string;
  isEditing: boolean;
  saveStatus: SaveStatus;
  canWrite: boolean;
  externalSyncTip?: string;
  onToggleSidebar: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleLineNumbers: () => void;
  onToggleWordWrap: () => void;
  onFontSizeChange: (delta: number) => void;
  onToggleToc: () => void;
  onToggleEditing: () => void;
  onSave: () => void;
}

export const ViewerHeader: React.FC<ViewerHeaderProps> = ({
  isSidebarCollapsed,
  viewMode,
  showLineNumbers,
  wordWrap,
  fontSize,
  hasToc,
  isTocOpen,
  currentContent,
  isEditing,
  saveStatus,
  canWrite,
  externalSyncTip,
  onToggleSidebar,
  onViewModeChange,
  onToggleLineNumbers,
  onToggleWordWrap,
  onFontSizeChange,
  onToggleToc,
  onToggleEditing,
  onSave,
}) => {
  const { t, toggleLocale } = useTranslation();
  const [copied, setCopied] = useState(false);

  // 复制代码或全文到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  return (
    <div className="viewer-header-container">
      {/* 左侧：折叠/展开侧边栏按钮 (对标截图) */}
      <div className="header-left-actions">
        <button
          type="button"
          className="header-icon-btn collapse-btn"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? t.header.expandSidebar : t.header.collapseSidebar}
        >
          <CollapseSidebarIcon size={17} />
        </button>

        {/* 查看模式切换 */}
        <select
          className="mode-select-dropdown"
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value as ViewMode)}
          title={t.header.modeSelectTitle}
        >
          <option value="markdown">{t.header.modeMarkdown}</option>
          <option value="code">{t.header.modeCode}</option>
          <option value="text">{t.header.modeText}</option>
        </select>
      </div>

      {/* 中间快捷工具栏 */}
      <div className="header-center-tools">
        {/* 字号缩放 */}
        <div className="font-size-adjuster" title={t.header.fontSizeTitle}>
          <button
            type="button"
            className="tool-btn"
            onClick={() => onFontSizeChange(-1)}
            disabled={fontSize <= 12}
          >
            A-
          </button>
          <span className="font-size-indicator">{fontSize}</span>
          <button
            type="button"
            className="tool-btn"
            onClick={() => onFontSizeChange(1)}
            disabled={fontSize >= 24}
          >
            A+
          </button>
        </div>

        {/* 自动换行开关 */}
        <button
          type="button"
          className={`tool-btn ${wordWrap ? "active" : ""}`}
          onClick={onToggleWordWrap}
          title={wordWrap ? t.header.wrapOff : t.header.wrapOn}
        >
          {t.header.wrap}
        </button>

        {/* 代码或纯文本模式下行号开关 */}
        {(viewMode === "code" || viewMode === "text") && (
          <button
            type="button"
            className={`tool-btn ${showLineNumbers ? "active" : ""}`}
            onClick={onToggleLineNumbers}
            title={showLineNumbers ? t.header.lineNumbersHide : t.header.lineNumbersShow}
          >
            {t.header.lineNumbers}
          </button>
        )}

        {/* 一键复制 */}
        <button
          type="button"
          className="tool-btn copy-action-btn"
          onClick={handleCopy}
          title={t.header.copyTitle}
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          <span>{copied ? t.header.copied : t.header.copy}</span>
        </button>

        {/* 编辑 / 预览 切换 */}
        <button
          type="button"
          className={`tool-btn edit-toggle-btn ${isEditing ? "active" : ""}`}
          onClick={onToggleEditing}
          title={isEditing ? t.header.previewTitle : t.header.editTitle}
        >
          {isEditing ? <EyeIcon size={14} /> : <EditIcon size={14} />}
          <span>{isEditing ? t.header.preview : t.header.edit}</span>
        </button>

        {/* 保存到物理磁盘 */}
        <button
          type="button"
          className={`tool-btn save-action-btn ${saveStatus === "dirty" ? "highlight" : ""}`}
          onClick={onSave}
          disabled={saveStatus === "saving" || !canWrite}
          title={canWrite ? t.header.saveTitle : t.header.saveReadonlyTitle}
        >
          <SaveIcon size={14} />
          <span>{saveStatus === "saving" ? t.header.saving : t.header.save}</span>
        </button>

        {/* 状态指示徽章 */}
        {saveStatus === "dirty" && (
          <span className="save-status-badge dirty" title={t.header.dirtyTitle}>
            {t.header.dirty}
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="save-status-badge saved" title={t.header.savedTitle}>
            ✓ {t.header.saved}
          </span>
        )}
        {externalSyncTip && (
          <span className="save-status-badge external-sync" title={externalSyncTip}>
            ⚡ {externalSyncTip}
          </span>
        )}
      </div>

      {/* 右侧：中英文切换按钮 + 章节大纲按钮 */}
      <div className="header-right-actions">
        {/* 紧凑单按钮中英文切换 */}
        <button
          type="button"
          className="tool-btn lang-toggle-btn"
          onClick={toggleLocale}
          title={t.header.langTitle}
        >
          <GlobeIcon size={13} />
          <span>{t.header.langBtn}</span>
        </button>

        {/* 章节大纲 TOC 抽屉 */}
        <button
          type="button"
          className={`header-icon-btn toc-menu-btn ${isTocOpen ? "active" : ""}`}
          onClick={onToggleToc}
          disabled={!hasToc}
          title={hasToc ? t.header.tocOpen : t.header.tocEmpty}
        >
          <MenuIcon size={18} />
        </button>
      </div>
    </div>
  );
};
