import type { SavedTab } from "@pagebox/types";

/**
 * 将单条书签格式化为 Markdown 链接格式
 * 格式示例：- [标题](URL) —— *备注*
 */
export function formatTabToMarkdown(tab: SavedTab): string {
  const rawTitle = (tab.title || tab.url).replace(/\r?\n/g, " ").trim();
  // 转义 Markdown 链接标题中可能破坏语法的括号
  const safeTitle = rawTitle.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
  const note = tab.notes?.trim() ? ` —— *${tab.notes.trim()}*` : "";
  return `- [${safeTitle}](${tab.url.trim()})${note}`;
}

/**
 * 将多条书签批量格式化为 Markdown 列表
 */
export function formatTabsToMarkdown(tabs: SavedTab[]): string {
  return tabs.map(formatTabToMarkdown).join("\n");
}

/**
 * 将文本写入剪贴板（支持现代 API 与降级虚拟选区复制方案）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. 优先尝试现代异步剪贴板 API
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 出现权限或未聚焦异常时，继续执行下方兼容选区方案
    }
  }

  // 2. 降级方案：创建隐藏 textarea 选区执行 document.execCommand('copy')
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("写入剪贴板失败:", err);
    return false;
  }
}
