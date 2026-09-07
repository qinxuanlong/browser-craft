import React, { useMemo } from "react";
import { highlightCode } from "../../services/syntaxHighlighter";

interface CodeViewerProps {
  code: string;
  language?: string;
  fontSize: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = "typescript",
  fontSize,
  showLineNumbers,
  wordWrap,
}) => {
  // 生成高亮 HTML
  const highlightedHtml = useMemo(() => {
    return highlightCode(code, language);
  }, [code, language]);

  const lines = useMemo(() => {
    return highlightedHtml.split("\n");
  }, [highlightedHtml]);

  return (
    <div
      className={`code-viewer-container ${wordWrap ? "wrap" : "nowrap"}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="code-language-tag">{language.toUpperCase()}</div>

      <div className="code-content-wrapper">
        {/* 行号列 */}
        {showLineNumbers && (
          <div className="code-line-numbers" aria-hidden="true">
            {lines.map((_, index) => (
              <span key={`line-${index}`} className="line-num">
                {index + 1}
              </span>
            ))}
          </div>
        )}

        {/* 代码高亮主体 */}
        <div className="code-lines-body">
          {lines.map((lineHtml, index) => (
            <div
              key={`code-line-${index}`}
              className="code-line-row"
              dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
