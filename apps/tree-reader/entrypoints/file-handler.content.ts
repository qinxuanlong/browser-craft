import { classifyFile } from "../src/services/fileClassifier";

export default defineContentScript({
  matches: ["file:///*"],
  runAt: "document_idle",
  main() {
    // 仅在本地文件协议下运行
    if (window.location.protocol !== "file:") return;

    const rawName = window.location.pathname.split("/").pop() || "";
    const fileName = decodeURIComponent(rawName);
    if (!fileName) return;

    // 检查是否为支持的文本或代码文件
    const { category } = classifyFile(fileName);
    const preElement = document.querySelector("pre");
    const isChromeTextPage =
      preElement !== null &&
      (document.body.children.length === 1 ||
        document.body.children[0] === preElement);

    // 如果既不是已知文本后缀，且不是 Chrome 原生纯文本容器，则不介入（如本地图片、音视频、PDF 等）
    if (category === "unknown" && !isChromeTextPage) {
      return;
    }

    // 提取文本内容
    const textContent = preElement
      ? preElement.textContent || ""
      : document.body?.innerText || "";

    const openInTreeReader = async (rememberAutoOpen: boolean) => {
      try {
        if (rememberAutoOpen) {
          await chrome.storage.local.set({ autoOpenLocalFiles: true });
        }

        await chrome.storage.local.set({
          pendingOpenFile: {
            id: `file-local-${Date.now()}`,
            name: fileName,
            path: decodeURIComponent(window.location.pathname),
            url: window.location.href,
            content: textContent,
            size: textContent.length,
            lastModified: document.lastModified
              ? new Date(document.lastModified).getTime()
              : Date.now(),
          },
        });

        // 平滑重定向当前标签页至 TreeReader 树读大屏
        window.location.replace(
          chrome.runtime.getURL("reader.html?fromLocalFile=1")
        );
      } catch (err) {
        console.error("唤起 TreeReader 树读失败:", err);
      }
    };

    // 检查是否已开启“默认自动打开”偏好
    chrome.storage.local.get(["autoOpenLocalFiles"]).then((res) => {
      if (res.autoOpenLocalFiles) {
        void openInTreeReader(false);
        return;
      }

      // 未开启自动跳转时，在页面右上角渲染精致悬浮引导条
      renderFloatingBar(fileName, openInTreeReader);
    });
  },
});

/**
 * 注入隔离的 Shadow DOM 悬浮胶囊工具条
 */
function renderFloatingBar(
  fileName: string,
  onOpen: (rememberAutoOpen: boolean) => Promise<void>
) {
  const host = document.createElement("div");
  host.id = "pagebox-tree-reader-floating-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    .pbox-floating-bar {
      position: fixed;
      top: 18px;
      right: 20px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      font-size: 13px;
      color: #1e293b;
      min-width: 280px;
      max-width: 360px;
      animation: pbox-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes pbox-fade-in {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .pbox-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .pbox-title-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #0f172a;
    }
    .pbox-icon {
      font-size: 15px;
    }
    .pbox-close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 4px;
      transition: all 0.15s;
    }
    .pbox-close-btn:hover {
      color: #475569;
      background: #f1f5f9;
    }
    .pbox-file-name {
      font-size: 12px;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: #f8fafc;
      padding: 3px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .pbox-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 2px;
    }
    .pbox-auto-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #64748b;
      cursor: pointer;
      user-select: none;
    }
    .pbox-auto-checkbox {
      cursor: pointer;
      accent-color: #2563eb;
    }
    .pbox-open-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .pbox-open-btn:hover {
      background: #1d4ed8;
    }
  `;
  shadow.appendChild(style);

  const container = document.createElement("div");
  container.className = "pbox-floating-bar";

  container.innerHTML = `
    <div class="pbox-header">
      <div class="pbox-title-wrap">
        <span class="pbox-icon">📖</span>
        <span>TreeReader 树读</span>
      </div>
      <button class="pbox-close-btn" title="关闭">×</button>
    </div>
    <div class="pbox-file-name" title="${fileName}">📄 ${fileName}</div>
    <div class="pbox-actions">
      <label class="pbox-auto-label">
        <input type="checkbox" class="pbox-auto-checkbox" />
        <span>以后默认自动进入速览</span>
      </label>
      <button class="pbox-open-btn">进入大屏速览</button>
    </div>
  `;

  shadow.appendChild(container);

  const closeBtn = container.querySelector(".pbox-close-btn");
  closeBtn?.addEventListener("click", () => {
    host.remove();
  });

  const openBtn = container.querySelector(".pbox-open-btn");
  const checkbox = container.querySelector<HTMLInputElement>(
    ".pbox-auto-checkbox"
  );

  openBtn?.addEventListener("click", () => {
    const remember = checkbox?.checked ?? false;
    void onOpen(remember);
  });
}
