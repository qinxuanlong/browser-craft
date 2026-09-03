export default defineBackground(() => {
  const enableSidePanel = () => {
    void chrome.sidePanel.setOptions({ path: "sidepanel.html", enabled: true });
  };

  enableSidePanel();
  chrome.runtime.onInstalled.addListener(enableSidePanel);
});
