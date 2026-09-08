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
  /** 在 PageBox 中打开访问的次数 */
  visitCount?: number;
  /** 最后一次打开访问的时间戳 */
  lastVisitedAt?: number;
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

/** 扩展元数据（备注、标签与高清图标、访问统计） */
export interface BookmarkMetadata {
  notes?: string;
  tags?: string[];
  favIconUrl?: string;
  /** 访问打开次数 */
  visitCount?: number;
  /** 最后访问时间戳 */
  lastVisitedAt?: number;
}

/** 死链检测结果 */
export interface DeadLinkResult {
  tabId: Id;
  url: string;
  title: string;
  status?: number;
  error?: string;
}

/** 浏览器历史记录访问统计辅助数据 */
export interface HistoryVisitStats {
  /** 在 Chrome 历史记录中的访问总次数 */
  visitCount: number;
  /** 在 Chrome 历史记录中的最后一次访问时间戳（毫秒） */
  lastVisitTime?: number;
}

// 从共享库重新导出通用 License 类型
export type {
  LicenseStatus,
  LicenseInfo,
  LicenseActivationResult,
  LicenseValidateResult,
  LicenseServiceOptions,
} from "@workspace/shared-license/types";



