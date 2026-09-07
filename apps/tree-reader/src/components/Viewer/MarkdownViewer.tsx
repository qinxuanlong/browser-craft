import React, { useEffect, useMemo } from "react";
import { TocItem } from "../../types";

interface MarkdownViewerProps {
  content: string;
  fontSize: number;
  wordWrap: boolean;
  onTocExtracted: (toc: TocItem[]) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  fontSize,
  wordWrap,
  onTocExtracted,
}) => {
  // 解析 Markdown 并提取 TOC 大纲
  const { renderedElements, tocList } = useMemo(() => {
    if (!content) {
      return { renderedElements: [], tocList: [] };
    }

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    const tocs: TocItem[] = [];

    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let currentParagraph: string[] = [];
    let headingIndex = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join("\n");
        elements.push(
          <p key={`p-${elements.length}`} className="reader-paragraph">
            {text}
          </p>
        );
        currentParagraph = [];
      }
    };

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trimEnd();

      // 代码块判定 ```
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${idx}`} className="reader-code-block">
              <code>{codeBlockLines.join("\n")}</code>
            </pre>
          );
          codeBlockLines = [];
          inCodeBlock = false;
        } else {
          flushParagraph();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockLines.push(rawLine);
        return;
      }

        // 标题判定: #, ##, ###, ####, #####, ###### 或者 ###1. 这种网文常见格式
        const headingMatch = line.match(/^(#{1,6})\s*(.*)$/);
        if (headingMatch) {
          flushParagraph();
          const level = Math.min(Math.max(headingMatch[1].length, 1), 6);
          const text = headingMatch[2] || "";
          const headingId = `heading-${headingIndex++}`;

          tocs.push({ id: headingId, level, text });

          const HeadingTag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
          elements.push(
            <HeadingTag
              key={`h-${idx}`}
              id={headingId}
              className={`reader-heading reader-h${level}`}
            >
              {line}
            </HeadingTag>
          );
          return;
        }

      // 引用块 >
      if (line.startsWith(">")) {
        flushParagraph();
        elements.push(
          <blockquote key={`quote-${idx}`} className="reader-quote">
            {line.replace(/^>\s*/, "")}
          </blockquote>
        );
        return;
      }

      // 列表项 - 或 *
      if (line.match(/^[-*]\s+/)) {
        flushParagraph();
        elements.push(
          <li key={`li-${idx}`} className="reader-list-item">
            {line.replace(/^[-*]\s+/, "")}
          </li>
        );
        return;
      }

      // 空行：刷新段落
      if (line.trim() === "") {
        flushParagraph();
        return;
      }

      // 普通正文行（小说自然段）
      currentParagraph.push(line);
    });

    flushParagraph();

    return { renderedElements: elements, tocList: tocs };
  }, [content]);

  // 将提取好的大纲同步给外层
  useEffect(() => {
    onTocExtracted(tocList);
  }, [tocList, onTocExtracted]);

  return (
    <div
      className={`markdown-viewer-body ${wordWrap ? "wrap" : "nowrap"}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {renderedElements.length > 0 ? (
        renderedElements
      ) : (
        <div className="viewer-empty-placeholder">暂无文本内容</div>
      )}
    </div>
  );
};
