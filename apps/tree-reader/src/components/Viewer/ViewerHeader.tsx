import React, { useState } from "react";
import { ViewMode } from "../../types";
import {
  CollapseSidebarIcon,
  MenuIcon,
  CopyIcon,
  CheckIcon,
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
  onToggleSidebar: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleLineNumbers: () => void;
  onToggleWordWrap: () => void;
  onFontSizeChange: (delta: number) => void;
  onToggleToc: () => void;
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
  onToggleSidebar,
  onViewModeChange,
  onToggleLineNumbers,
  onToggleWordWrap,
  onFontSizeChange,
  onToggleToc,
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
