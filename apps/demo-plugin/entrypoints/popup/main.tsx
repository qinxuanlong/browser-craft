import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { getCurrentActiveTab } from "@workspace/shared-utils";

function App() {
  const [tabTitle, setTabTitle] = useState<string>("加载中...");

  useEffect(() => {
    getCurrentActiveTab().then((tab) => {
      setTabTitle(tab?.title || "未获取到活跃标签页");
    });
  }, []);

  return (
    <div style={{ padding: 16, width: 280, boxSizing: "border-box" }}>
      <h2 style={{ fontSize: 16, margin: "0 0 12px", color: "#1e293b" }}>
        🚀 Demo Plugin 插件模版
      </h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px", wordBreak: "break-all" }}>
        当前标签页：<strong>{tabTitle}</strong>
      </p>
      <div
        style={{
          padding: 10,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          borderRadius: 6,
          fontSize: 12,
          color: "#065f46",
        }}
      >
        版本状态：✨ 全功能版已解锁
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
