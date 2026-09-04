import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 修复 WXT 构建产物中 HTML 静态资源的绝对路径引用。
 * 确保在 Chrome MV3 各种页面（如 Popup / SidePanel / Manager）中以相对路径正确加载静态资源。
 */
export function fixExtensionHtmlPaths(
  outDir: string,
  targetFiles: string[] = ["popup.html", "sidepanel.html", "manager.html", "options.html"]
): void {
  for (const file of targetFiles) {
    const filePath = join(outDir, file);
    if (!existsSync(filePath)) continue;
    const html = readFileSync(filePath, "utf8")
      .replace(/src="\/chunks\//g, 'src="./chunks/')
      .replace(/href="\/chunks\//g, 'href="./chunks/')
      .replace(/href="\/assets\//g, 'href="./assets/');
    writeFileSync(filePath, html);
  }
}
