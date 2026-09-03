import { createRoot } from "react-dom/client";
import { PageBoxApp } from "@pagebox/ui";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<PageBoxApp variant="sidepanel" />);
}
