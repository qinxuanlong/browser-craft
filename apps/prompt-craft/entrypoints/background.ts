import { PRESET_SKILLS } from "../src/presets";

export default defineBackground(() => {
  // 扩展初次安装或更新时，初始化预置技能库
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      try {
        const stored = await chrome.storage.local.get(["promptcraft_skills"]);
        if (!stored.promptcraft_skills || stored.promptcraft_skills.length === 0) {
          await chrome.storage.local.set({ promptcraft_skills: PRESET_SKILLS });
        }
      } catch (err) {
        console.error("初始化预置技能库失败:", err);
      }
    }
  });

  // 侦听来自 Content Script 或 Popup 的指令消息
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === "open_manager") {
      const managerUrl = chrome.runtime.getURL("manager.html");

      chrome.tabs.query({ url: `${managerUrl}*` }).then((tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          chrome.tabs.update(tabs[0].id, { active: true });
          if (tabs[0].windowId) {
            chrome.windows.update(tabs[0].windowId, { focused: true });
          }
        } else {
          chrome.tabs.create({ url: managerUrl });
        }
      });
      sendResponse({ status: "ok" });
    }
  });
});
