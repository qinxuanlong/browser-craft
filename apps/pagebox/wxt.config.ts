import { resolve } from "node:path";
import { defineConfig } from "wxt";
import { fixExtensionHtmlPaths } from "@workspace/shared-utils/wxt";


export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  runner: {
    disabled: true,
  },
  manifest: {
    name: "PageBox — 标签页收藏",
    description: "收藏、搜索、恢复浏览器标签页与窗口",
    version: "0.0.3",
    permissions: ["tabs", "storage", "sidePanel", "bookmarks", "favicon", "history"],
    host_permissions: ["https://api.lemonsqueezy.com/*", "*://*/*"],
    web_accessible_resources: [
      {
        resources: ["_favicon/*"],
        matches: ["<all_urls>"],
      },
    ],
    action: {
      default_title: "PageBox",
      default_icon: {
        16: "icons/icon-16.png",
        32: "icons/icon-32.png",
        48: "icons/icon-48.png",
        128: "icons/icon-128.png",
      },
    },
    icons: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
  },
  vite: () => ({
    build: {
      // Chrome 扩展页面（尤其 Side Panel）加载带 crossorigin 的 modulepreload 会失败
      modulePreload: false,
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  }),
  hooks: {
    "build:done": (wxt) => {
      fixExtensionHtmlPaths(resolve(wxt.config.outDir));
    },
  },
});
