import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { getCurrentActiveTab } from "@workspace/shared-utils";
import { createLicenseService } from "@workspace/shared-license";

const licenseService = createLicenseService({
  appName: "DemoPlugin",
  checkoutUrl: "https://example.com/checkout",
});

function App() {
  const [tabTitle, setTabTitle] = useState<string>("加载中...");
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    getCurrentActiveTab().then((tab) => {
      setTabTitle(tab?.title || "未获取到活跃标签页");
    });
    licenseService.getLicenseInfo().then((info) => {
      setIsPro(info.isPro);
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
          background: isPro ? "#ecfdf5" : "#f1f5f9",
          border: `1px solid ${isPro ? "#a7f3d0" : "#cbd5e1"}`,
          borderRadius: 6,
          fontSize: 12,
          color: isPro ? "#065f46" : "#475569",
        }}
      >
        会员状态：{isPro ? "✅ Pro 已激活" : "⚡ 免费体验版"}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
