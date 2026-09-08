import type { BookmarkMetadata, SavedWindow } from "@pagebox/types";

const METADATA_STORAGE_KEY = "pagebox_metadata";
const WINDOWS_STORAGE_KEY = "pagebox_windows";
const LEGACY_STORAGE_KEY = "pagebox_store";

export class LocalStorageRepository {
  /**
   * 获取所有书签元数据映射（支持从旧版本自动迁移已有备注）
   */
  async getAllMetadata(): Promise<Record<string, BookmarkMetadata>> {
    const result = await chrome.storage.local.get([METADATA_STORAGE_KEY, LEGACY_STORAGE_KEY]);
    let metadata = result[METADATA_STORAGE_KEY] as Record<string, BookmarkMetadata> | undefined;

    // 自动兼容迁移旧存储中已有的备注与标签
    if (!metadata && result[LEGACY_STORAGE_KEY]) {
      metadata = {};
      const oldStore = result[LEGACY_STORAGE_KEY];
      if (Array.isArray(oldStore?.tabs)) {
        for (const tab of oldStore.tabs) {
          const bookmarkId = tab.bookmarkId || tab.id;
          if (bookmarkId && (tab.notes || (tab.tags && tab.tags.length > 0) || tab.favIconUrl)) {
            metadata[bookmarkId] = {
              notes: tab.notes,
              tags: tab.tags,
              favIconUrl: tab.favIconUrl,
            };
          }
        }
      }
      // 保存迁移结果
      await chrome.storage.local.set({ [METADATA_STORAGE_KEY]: metadata });
    }

    return metadata ?? {};
  }

  /**
   * 获取单个书签的扩展元数据
   */
  async getMetadata(bookmarkId: string): Promise<BookmarkMetadata | undefined> {
    const all = await this.getAllMetadata();
    return all[bookmarkId];
  }

  /**
   * 设置或更新单个书签的扩展元数据
   */
  async setMetadata(bookmarkId: string, meta: BookmarkMetadata): Promise<void> {
    const all = await this.getAllMetadata();
    all[bookmarkId] = { ...all[bookmarkId], ...meta };
    await chrome.storage.local.set({ [METADATA_STORAGE_KEY]: all });
  }

  /**
   * 移除指定书签的扩展元数据
   */
  async removeMetadata(bookmarkId: string): Promise<void> {
    const all = await this.getAllMetadata();
    if (bookmarkId in all) {
      delete all[bookmarkId];
      await chrome.storage.local.set({ [METADATA_STORAGE_KEY]: all });
    }
  }

  /**
   * 记录书签访问（访问次数累加，更新最后访问时间）
   */
  async recordVisit(bookmarkId: string): Promise<void> {
    const all = await this.getAllMetadata();
    const current = all[bookmarkId] || {};
    all[bookmarkId] = {
      ...current,
      visitCount: (current.visitCount ?? 0) + 1,
      lastVisitedAt: Date.now(),
    };
    await chrome.storage.local.set({ [METADATA_STORAGE_KEY]: all });
  }

  /**
   * 获取保存的窗口集合
   */
  async getWindows(): Promise<SavedWindow[]> {
    const result = await chrome.storage.local.get([WINDOWS_STORAGE_KEY, LEGACY_STORAGE_KEY]);
    let windows = result[WINDOWS_STORAGE_KEY] as SavedWindow[] | undefined;

    // 兼容迁移旧存储中的窗口数据
    if (!windows && result[LEGACY_STORAGE_KEY]?.windows) {
      windows = result[LEGACY_STORAGE_KEY].windows as SavedWindow[];
      await chrome.storage.local.set({ [WINDOWS_STORAGE_KEY]: windows });
    }

    return windows ?? [];
  }

  /**
   * 保存窗口集合
   */
  async saveWindows(windows: SavedWindow[]): Promise<void> {
    await chrome.storage.local.set({ [WINDOWS_STORAGE_KEY]: windows });
  }

  /**
   * 清理所有数据
   */
  async clear(): Promise<void> {
    await chrome.storage.local.remove([METADATA_STORAGE_KEY, WINDOWS_STORAGE_KEY, LEGACY_STORAGE_KEY]);
  }
}

export const storageRepository = new LocalStorageRepository();
