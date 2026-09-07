/**
 * TreeReader 核心数据结构与契约定义
 */

export type FileCategory = "markdown" | "code" | "text" | "unknown";

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string;
  children?: FileItem[];
  extension?: string;
  category?: FileCategory;
  language?: string;
  size?: number;
}

export type ViewMode = "markdown" | "code" | "text";

export type NavTabType = "tree" | "list" | "search" | "filter";

export type FilterCategory = "all" | "markdown" | "code" | "text";

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

export interface ReaderSettings {
  isSidebarCollapsed: boolean;
  fontSize: number; // 默认 16px
  showLineNumbers: boolean;
  wordWrap: boolean;
  theme: "light" | "warm" | "green" | "dark";
  activeTab: NavTabType;
  filterCategory: FilterCategory;
}
