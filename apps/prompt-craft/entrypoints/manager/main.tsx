import React from "react";
import ReactDOM from "react-dom/client";
import { ManagerApp } from "../../src/components/ManagerApp";
import "../../src/styles/manager.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ManagerApp />
    </React.StrictMode>
  );
}
