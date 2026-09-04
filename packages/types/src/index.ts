/** 唯一标识 */
export type Id = string;

/** 收藏的单页标签 */
export interface SavedTab {
  id: Id;
  folderId: Id | null;
  title: string;
  url: string;
  favIconUrl?: string;
  notes?: string;
  tags: string[];
  /** 关联的浏览器书签 ID，用于同步 */
  bookmarkId?: string;
  /** 排序序号（对应书签位置顺序） */
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
}

/** 收藏的窗口（含多个标签） */
export interface SavedWindow {
  id: Id;
  folderId: Id | null;
  name: string;
  tabs: Omit<SavedTab, "folderId">[];
  notes?: string;
  tags: string[];
  /** 排序序号 */
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
}

/** 文件夹 */
export interface Folder {
  id: Id;
  parentId: Id | null;
  name: string;
  sortOrder: number;
  /** 关联的浏览器书签文件夹 ID，用于同步 */
  bookmarkId?: string;
  createdAt: number;
  updatedAt: number;
}

/** 根存储结构 */
export interface PageBoxStore {
  version: 1;
  folders: Folder[];
  tabs: SavedTab[];
  windows: SavedWindow[];
}

export type SavedItem = SavedTab | SavedWindow;

export function isSavedWindow(item: SavedItem): item is SavedWindow {
  return "tabs" in item;
}

/** 导出/导入格式 */
export interface PageBoxExport {
  exportedAt: number;
  store: PageBoxStore;
}

export interface SearchResult {
  tabs: SavedTab[];
  windows: SavedWindow[];
}

/** 扩展元数据（备注、标签与高清图标） */
export interface BookmarkMetadata {
  notes?: string;
  tags?: string[];
  favIconUrl?: string;
}

// 从共享库重新导出通用 License 类型
export type {
  LicenseStatus,
  LicenseInfo,
  LicenseActivationResult,
  LicenseValidateResult,
  LicenseServiceOptions,
} from "@workspace/shared-license/types";



