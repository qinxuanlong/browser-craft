import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "wxt";

function fixExtensionHtmlPaths(outDir: string) {
  for (const file of ["popup.html", "sidepanel.html", "manager.html"]) {
    const filePath = join(outDir, file);
    if (!existsSync(filePath)) continue;
    const html = readFileSync(filePath, "utf8")
      .replace(/src="\/chunks\//g, 'src="./chunks/')
      .replace(/href="\/chunks\//g, 'href="./chunks/')
      .replace(/href="\/assets\//g, 'href="./assets/');
    writeFileSync(filePath, html);
  }
}

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  runner: {
    disabled: true,
  },
  manifest: {
    name: "PageBox — 标签页收藏",
    description: "收藏、搜索、恢复浏览器标签页与窗口",
    version: "0.0.1",
    permissions: ["tabs", "storage", "sidePanel", "bookmarks"],
    action: {
      default_title: "PageBox",
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
