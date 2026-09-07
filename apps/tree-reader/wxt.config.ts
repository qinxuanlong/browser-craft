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
      default_title: "打开 TreeReader 树读",
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
