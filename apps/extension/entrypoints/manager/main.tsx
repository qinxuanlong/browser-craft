import { createRoot } from "react-dom/client";
import { ManagerApp } from "@pagebox/ui";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<ManagerApp />);
}
