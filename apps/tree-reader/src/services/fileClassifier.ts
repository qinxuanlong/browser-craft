import { FileCategory, ViewMode } from "../types";

/**
 * 根据文件名后缀识别分类与语言
 */
export function classifyFile(filename: string): {
  category: FileCategory;
  language: string;
  defaultMode: ViewMode;
} {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";

  // Markdown 文档
  if (["md", "markdown", "mdown", "mkd"].includes(ext)) {
    return {
      category: "markdown",
      language: "markdown",
      defaultMode: "markdown",
    };
  }

  // 常见代码与脚本
  const codeLanguages: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    py: "python",
    java: "java",
    go: "go",
    rs: "rust",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    less: "less",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    yml: "yaml",
    yaml: "yaml",
    toml: "toml",
    xml: "xml",
    vue: "vue",
  };

  if (codeLanguages[ext]) {
    return {
      category: "code",
      language: codeLanguages[ext],
      defaultMode: "code",
    };
  }

  // 纯文本与日志
  if (["txt", "log", "csv", "env", "ini", "conf"].includes(ext)) {
    return {
      category: "text",
      language: "text",
      defaultMode: "text",
    };
  }

  return {
    category: "unknown",
    language: "text",
    defaultMode: "text",
  };
}

/**
 * 格式化文件大小展示
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
