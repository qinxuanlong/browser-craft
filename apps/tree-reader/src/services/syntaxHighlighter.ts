/**
 * 极简高效的代码词法着色器（零外部臃肿依赖，安全无 XSS）
 */

// HTML 特殊字符转义
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function highlightCode(code: string, language: string = "typescript"): string {
  if (!code) return "";

  // 统一换行
  const lines = code.split("\n");

  const commonKeywords = new Set([
    "const", "let", "var", "function", "return", "if", "else", "for", "while",
    "switch", "case", "default", "break", "continue", "import", "export", "from",
    "as", "class", "extends", "implements", "interface", "type", "new", "this",
    "super", "async", "await", "try", "catch", "finally", "throw", "typeof",
    "instanceof", "void", "delete", "in", "of", "null", "undefined", "true", "false",
    "def", "class", "self", "None", "True", "False", "elif", "print", "lambda",
    "package", "func", "struct", "go", "select", "chan", "defer", "range",
    "public", "private", "protected", "static", "final", "abstract",
    "SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "JOIN", "ON", "GROUP", "BY", "ORDER"
  ]);

  return lines
    .map((line) => {
      let result = "";
      let i = 0;
      const len = line.length;

      while (i < len) {
        // 单行注释 // 或 #
        if (
          (line[i] === "/" && line[i + 1] === "/") ||
          (line[i] === "#" && language !== "c" && language !== "cpp")
        ) {
          result += `<span class="token-comment">${escapeHtml(line.slice(i))}</span>`;
          break;
        }

        // 字符串 "..." 或 '...' 或 `...`
        if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
          const quote = line[i];
          let j = i + 1;
          while (j < len && (line[j] !== quote || line[j - 1] === "\\")) {
            j++;
          }
          if (j < len) j++; // 包含结束引号
          result += `<span class="token-string">${escapeHtml(line.slice(i, j))}</span>`;
          i = j;
          continue;
        }

        // 数字
        if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z0-9_$]/.test(line[i - 1]))) {
          let j = i;
          while (j < len && /[0-9.xXabcdefABCDEF]/.test(line[j])) {
            j++;
          }
          result += `<span class="token-number">${escapeHtml(line.slice(i, j))}</span>`;
          i = j;
          continue;
        }

        // 标识符或关键词
        if (/[a-zA-Z_$]/.test(line[i])) {
          let j = i;
          while (j < len && /[a-zA-Z0-9_$]/.test(line[j])) {
            j++;
          }
          const word = line.slice(i, j);
          if (commonKeywords.has(word)) {
            result += `<span class="token-keyword">${escapeHtml(word)}</span>`;
          } else if (j < len && line[j] === "(") {
            result += `<span class="token-function">${escapeHtml(word)}</span>`;
          } else {
            result += escapeHtml(word);
          }
          i = j;
          continue;
        }

        // 普通字符
        result += escapeHtml(line[i]);
        i++;
      }

      return result;
    })
    .join("\n");
}
