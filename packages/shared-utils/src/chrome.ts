/**
 * 获取当前活跃窗口的活动标签页
 */
export async function getCurrentActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    return undefined;
  }
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

/**
 * 判断 URL 是否为有效的 HTTP/HTTPS 网页
 */
export function isHttpUrl(url?: string): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * 获取 Chrome 扩展专用的 Favicon 格式化 URL
 */
export function getExtensionFaviconUrl(pageUrl: string, size = 32): string {
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL) {
    return "";
  }
  return chrome.runtime.getURL(`_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=${size}`);
}
