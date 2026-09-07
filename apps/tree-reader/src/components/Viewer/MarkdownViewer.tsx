import React, { useEffect, useMemo } from "react";
import { Marked } from "marked";
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
  // 解析 Markdown 并提取 TOC 章节目录
  const { html, tocList } = useMemo(() => {
    if (!content) {
      return { html: "", tocList: [] };
    }

    const tocs: TocItem[] = [];
    let headingCount = 0;

    const md = new Marked({
      gfm: true,
      breaks: true,
    });

    md.use({
      renderer: {
        heading({ tokens, depth, text }) {
          const headingId = `heading-${headingCount++}`;
          // 纯文本化处理大纲目录（去除加粗、代码、斜体等标记符号）
          const cleanText = text.replace(/[*_`~#]/g, "").trim() || text;
          tocs.push({ id: headingId, level: depth, text: cleanText });

          const inlineHtml = this.parser.parseInline(tokens);
          return `<h${depth} id="${headingId}" class="reader-heading reader-h${depth}">${inlineHtml}</h${depth}>\n`;
        },
        link({ href, title, tokens }) {
          const inlineHtml = this.parser.parseInline(tokens);
          const titleAttr = title ? ` title="${title}"` : "";
          return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${inlineHtml}</a>`;
        },
      },
    });

    // 预处理：网文及部分格式无空格标题兼容（例如：###第1章 旅途开始 -> ### 第1章 旅途开始）
    const preprocessed = content.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");
    const parsedHtml = md.parse(preprocessed) as string;

    return { html: parsedHtml, tocList: tocs };
  }, [content]);

  // 将提取好的大纲同步给外层状态
  useEffect(() => {
    onTocExtracted(tocList);
  }, [tocList, onTocExtracted]);

  return (
    <div
      className={`markdown-viewer-body ${wordWrap ? "wrap" : "nowrap"}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {html ? (
        <div
          className="markdown-content-rendered"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="viewer-empty-placeholder">暂无文本内容</div>
      )}
    </div>
  );
};

