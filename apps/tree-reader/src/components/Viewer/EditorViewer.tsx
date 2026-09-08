import React, { useRef, useMemo, useEffect } from "react";
import { useTranslation } from "../../i18n/I18nContext";

interface EditorViewerProps {
  content: string;
  onChange: (newContent: string) => void;
  onSave?: () => void;
  fontSize: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
}

export const EditorViewer: React.FC<EditorViewerProps> = ({
  content,
  onChange,
  onSave,
  fontSize,
  showLineNumbers,
  wordWrap,
}) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => {
    return (content || "").split("\n");
  }, [content]);

  // 同步行号容器与 textarea 滚动条
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // 支持快捷键 Ctrl+S / Cmd+S 与 Tab 键缩进
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      onSave?.();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const updated = val.substring(0, start) + "  " + val.substring(end);
      onChange(updated);

      // 保持光标位置在缩进后
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  useEffect(() => {
    // 自动聚焦编辑器
    textareaRef.current?.focus();
  }, []);

  return (
    <div
      className={`editor-viewer-container ${wordWrap ? "wrap" : "nowrap"}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="editor-wrapper">
        {/* 行号栏 */}
        {showLineNumbers && (
          <div className="editor-line-numbers" ref={lineNumbersRef} aria-hidden="true">
            {lines.map((_, index) => (
              <span key={`line-${index}`} className="line-num">
                {index + 1}
              </span>
            ))}
          </div>
        )}

        {/* 核心编辑域 */}
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={t.viewer.editorPlaceholder}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
};
