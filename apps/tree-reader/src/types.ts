/**
 * PageBox 目录速览核心数据结构与契约定义
 */

export type FileCategory = "markdown" | "code" | "text" | "unknown";

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string; // 内置示例内容或已加载的内容
  children?: FileItem[];
  extension?: string;
  category?: FileCategory;
  language?: string;
  size?: number;
  rawFile?: File; // 内存中的 File 对象引用（按需动态读取，绝不持久化存储）
  fileHandle?: FileSystemFileHandle; // 现代浏览器 FileSystemFileHandle 句柄
  dirHandle?: FileSystemDirectoryHandle; // 现代浏览器 FileSystemDirectoryHandle 目录句柄
  lastModified?: number; // 文件最后修改时间戳（毫秒），用于外部修改对比
}

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export type ViewMode = "markdown" | "code" | "text";

export type NavTabType = "tree" | "list" | "search" | "filter";

export type FilterCategory = "all" | "markdown" | "code" | "text";

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

export type Locale = "zh-CN" | "en-US";

export interface ReaderSettings {
  isSidebarCollapsed: boolean;
  fontSize: number; // 默认 15px
  showLineNumbers: boolean;
  wordWrap: boolean;
  theme: "light" | "warm" | "green" | "dark";
  activeTab: NavTabType;
  filterCategory: FilterCategory;
  locale: Locale;
}
