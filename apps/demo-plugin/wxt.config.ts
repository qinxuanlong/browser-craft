import { resolve } from "node:path";
import { defineConfig } from "wxt";
import { fixExtensionHtmlPaths } from "@workspace/shared-utils/wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  runner: {
    disabled: true,
  },
  manifest: {
    name: "Demo Plugin — 模版插件",
    description: "多插件 Monorepo 开发模版示例",
    version: "0.0.1",
    permissions: ["storage", "tabs"],
    action: {
      default_title: "Demo Plugin",
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
      fixExtensionHtmlPaths(resolve(wxt.config.outDir), ["popup.html"]);
    },
  },
});
