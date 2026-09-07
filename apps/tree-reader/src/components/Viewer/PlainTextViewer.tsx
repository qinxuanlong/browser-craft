import React, { useMemo } from "react";

interface PlainTextViewerProps {
  text: string;
  fontSize: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
}

export const PlainTextViewer: React.FC<PlainTextViewerProps> = ({
  text,
  fontSize,
  showLineNumbers,
  wordWrap,
}) => {
  const lines = useMemo(() => {
    return (text || "").split("\n");
  }, [text]);

  return (
    <div
      className={`plain-text-container ${wordWrap ? "wrap" : "nowrap"}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="plain-content-wrapper">
        {/* 行号 */}
        {showLineNumbers && (
          <div className="plain-line-numbers" aria-hidden="true">
            {lines.map((_, index) => (
              <span key={`line-${index}`} className="line-num">
                {index + 1}
              </span>
            ))}
          </div>
        )}

        {/* 纯文本内容行 */}
        <div className="plain-lines-body">
          {lines.map((line, index) => (
            <div key={`plain-line-${index}`} className="plain-line-row">
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
