import React, { useState } from "react";
import { ViewMode, SaveStatus } from "../../types";
import {
  CollapseSidebarIcon,
  MenuIcon,
  CopyIcon,
  CheckIcon,
  EditIcon,
  EyeIcon,
  SaveIcon,
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
          title={isSidebarCollapsed ? "展开侧边栏目录" : "收起侧边栏全宽阅读"}
        >
          <CollapseSidebarIcon size={17} />
        </button>

        {/* 查看模式切换 */}
        <select
          className="mode-select-dropdown"
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value as ViewMode)}
          title="切换查看模式"
        >
          <option value="markdown">📖 Markdown 排版</option>
          <option value="code">💻 代码高亮</option>
          <option value="text">📄 纯文本/日志</option>
        </select>
      </div>

      {/* 中间快捷工具栏 */}
      <div className="header-center-tools">
        {/* 字号缩放 */}
        <div className="font-size-adjuster" title="字号调节">
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
          title={wordWrap ? "关闭自动折行" : "开启自动折行"}
        >
          换行
        </button>

        {/* 代码或纯文本模式下行号开关 */}
        {(viewMode === "code" || viewMode === "text") && (
          <button
            type="button"
            className={`tool-btn ${showLineNumbers ? "active" : ""}`}
            onClick={onToggleLineNumbers}
            title={showLineNumbers ? "隐藏行号" : "显示行号"}
          >
            行号
          </button>
        )}

        {/* 一键复制 */}
        <button
          type="button"
          className="tool-btn copy-action-btn"
          onClick={handleCopy}
          title="复制全文内容"
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          <span>{copied ? "已复制" : "复制"}</span>
        </button>

        {/* 编辑 / 预览 切换 */}
        <button
          type="button"
          className={`tool-btn edit-toggle-btn ${isEditing ? "active" : ""}`}
          onClick={onToggleEditing}
          title={isEditing ? "切换为预览模式" : "切换为编辑模式"}
        >
          {isEditing ? <EyeIcon size={14} /> : <EditIcon size={14} />}
          <span>{isEditing ? "预览" : "编辑"}</span>
        </button>

        {/* 保存到物理磁盘 */}
        <button
          type="button"
          className={`tool-btn save-action-btn ${saveStatus === "dirty" ? "highlight" : ""}`}
          onClick={onSave}
          disabled={saveStatus === "saving" || !canWrite}
          title={canWrite ? "保存修改至本地磁盘 (Ctrl+S)" : "当前为只读模式，无法写回磁盘"}
        >
          <SaveIcon size={14} />
          <span>{saveStatus === "saving" ? "保存中..." : "保存"}</span>
        </button>

        {/* 状态指示徽章 */}
        {saveStatus === "dirty" && (
          <span className="save-status-badge dirty" title="有未保存修改">
            ● 未保存
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="save-status-badge saved" title="已成功写入本地物理磁盘">
            ✓ 已保存
          </span>
        )}
        {externalSyncTip && (
          <span className="save-status-badge external-sync" title={externalSyncTip}>
            ⚡ {externalSyncTip}
          </span>
        )}
      </div>

      {/* 右侧：章节大纲/目录抽屉按钮 (对标截图) */}
      <div className="header-right-actions">
        <button
          type="button"
          className={`header-icon-btn toc-menu-btn ${isTocOpen ? "active" : ""}`}
          onClick={onToggleToc}
          disabled={!hasToc}
          title={hasToc ? "展开/收起章节大纲" : "本文档无标题大纲"}
        >
          <MenuIcon size={18} />
        </button>
      </div>
    </div>
  );
};
