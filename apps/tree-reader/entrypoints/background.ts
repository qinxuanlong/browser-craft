export default defineBackground(() => {
  // 点击浏览器工具栏扩展图标时，直接在新标签页中打开 TreeReader
  chrome.action.onClicked.addListener(async () => {
    const targetUrl = chrome.runtime.getURL("reader.html");

    try {
      // 查找当前浏览器中是否已经有已打开的 TreeReader 标签页
      const existingTabs = await chrome.tabs.query({ url: `${targetUrl}*` });
      const firstTab = existingTabs[0];

      if (firstTab && typeof firstTab.id === "number") {
        // 已经打开过则直接激活切换到该标签页，避免重复多开
        await chrome.tabs.update(firstTab.id, { active: true });
        if (typeof firstTab.windowId === "number") {
          await chrome.windows.update(firstTab.windowId, { focused: true });
        }
      } else {
        // 否则直接创建崭新的阅读器标签页
        await chrome.tabs.create({ url: targetUrl });
      }
    } catch (error) {
      console.error("打开 TreeReader 标签页失败:", error);
    }
  });
});
