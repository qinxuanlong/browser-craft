import { resolve } from "node:path";
import { defineConfig } from "wxt";
import { fixExtensionHtmlPaths } from "@workspace/shared-utils/wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  runner: {
    disabled: true,
  },
  manifest: {
    name: "TreeReader — 树读",
    description: "结构化文本、代码与多级目录树独立标签页阅读器",
    version: "0.0.1",
    permissions: ["storage", "tabs"],
    action: {
      default_title: "TreeReader — 树读",
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
      fixExtensionHtmlPaths(resolve(wxt.config.outDir));
    },
  },
});
