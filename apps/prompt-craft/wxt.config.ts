import { resolve } from "node:path";
import { defineConfig } from "wxt";
import { fixExtensionHtmlPaths } from "@workspace/shared-utils/wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  runner: {
    disabled: true,
  },
  manifest: {
    name: "PromptCraft — 灵感工坊",
    description: "AI 提示词资产化与结构化工作流智能注入插件，支持斜杠指令与变量自适应填充",
    version: "0.0.1",
    permissions: ["storage", "activeTab"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "PromptCraft — 灵感工坊",
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
      modulePreload: false,
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  }),
  hooks: {
    "build:done": (wxt) => {
      fixExtensionHtmlPaths(resolve(wxt.config.outDir), [
        "popup.html",
        "manager.html",
      ]);
    },
  },
});
