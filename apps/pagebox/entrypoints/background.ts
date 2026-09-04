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
});

