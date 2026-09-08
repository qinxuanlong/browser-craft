import { syncTabFavicon } from "@pagebox/core";

export default defineBackground(() => {
  const enableSidePanel = () => {
    void chrome.sidePanel.setOptions({ path: "sidepanel.html", enabled: true });
  };

  enableSidePanel();
  chrome.runtime.onInstalled.addListener(enableSidePanel);

  // 监听标签页更新，捕获并持久化 favicon 到已有书签和保存的窗口中
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    const favIconUrl = changeInfo.favIconUrl || tab.favIconUrl;
    const tabUrl = tab.url;
    if (favIconUrl && tabUrl) {
      void syncTabFavicon(tabUrl, favIconUrl);
    }
  });

  // 支持前台页面跨域链接可用性检测（Background Service Worker 享有 host_permissions 豁免跨域限制特权）
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "PAGEBOX_CHECK_URL" && typeof message.url === "string") {
      probeUrl(message.url, message.timeoutMs ?? 6000)
        .then(sendResponse)
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true; // 保持异步消息响应通道开启
    }
  });
});

/**
 * 在后台安全探测 URL 可用性
 */
async function probeUrl(
  url: string,
  timeoutMs = 6000
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res: Response | null = null;
    try {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
    } catch {
      if (controller.signal.aborted) {
        return { ok: false, error: "请求超时 (6秒无响应)" };
      }
      // 如果标准 fetch 抛错（例如内网环境或同源拦截），降级使用 no-cors 检验纯 TCP/HTTP 连通性
      try {
        await fetch(url, {
          method: "GET",
          mode: "no-cors",
          signal: controller.signal,
        });
        // 成功建立网络连接并获得响应，说明服务器存活
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: controller.signal.aborted ? "请求超时" : "无法连接 / 域名无法解析",
        };
      }
    } finally {
      clearTimeout(timer);
    }

    if (res) {
      // 401/403 表示页面存在但需要登录验证（如企业内网、单点登录系统），属于有效链接
      if (res.status === 401 || res.status === 403) {
        return { ok: true, status: res.status };
      }
      // 404 / 410 / 500 / 502 / 503 / 504 明确标记为死链/服务故障
      if (res.status >= 400) {
        return {
          ok: false,
          status: res.status,
          error: `HTTP ${res.status} (${res.statusText || "访问出错"})`,
        };
      }
      return { ok: true, status: res.status };
    }

    return { ok: true };
  } catch {
    clearTimeout(timer);
    return { ok: false, error: "网络探测异常" };
  }
}

