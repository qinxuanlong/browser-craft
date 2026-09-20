import React from "react";
import ReactDOM from "react-dom/client";
import { PromptCraftRoot } from "../src/components/PromptCraftRoot";
import contentCss from "../src/styles/content.css?inline";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  runAt: "document_idle",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "promptcraft-injector-root",
      position: "inline",
      anchor: "body",
      append: "last",
      onMount: (container) => {
        // 将隔离样式注入 Shadow Root
        const style = document.createElement("style");
        style.textContent = contentCss;
        container.appendChild(style);

        const mountPoint = document.createElement("div");
        mountPoint.id = "promptcraft-mount-root";
        container.appendChild(mountPoint);

        const root = ReactDOM.createRoot(mountPoint);
        root.render(React.createElement(PromptCraftRoot));
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
