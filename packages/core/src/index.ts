import type {
  Folder,
  Id,
  PageBoxExport,
  PageBoxStore,
  SavedTab,
  SavedWindow,
  SearchResult,
} from "@pagebox/types";
import { LocalStorageRepository } from "@pagebox/storage";

function createId(): Id {
  return crypto.randomUUID();
}

function now(): number {
  return Date.now();
}

function isSaveableUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" || protocol === "file:";
  } catch {
    return false;
  }
}

export class PageBoxService {
  constructor(private readonly repo = new LocalStorageRepository()) {}

  async getStore(): Promise<PageBoxStore> {
    return this.repo.getStore();
  }

  async createFolder(name: string, parentId: Id | null = null): Promise<Folder> {
    const store = await this.repo.getStore();
    const folder: Folder = {
      id: createId(),
      parentId,
      name,
      sortOrder: store.folders.filter((f) => f.parentId === parentId).length,
      createdAt: now(),
      updatedAt: now(),
    };
    store.folders.push(folder);
    await this.repo.saveStore(store);
    return folder;
  }

  async renameFolder(id: Id, name: string): Promise<Folder> {
    const store = await this.repo.getStore();
    const folder = store.folders.find((f) => f.id === id);
    if (!folder) throw new Error("文件夹不存在");
    folder.name = name.trim() || folder.name;
    folder.updatedAt = now();
    await this.repo.saveStore(store);
    return folder;
  }

  async deleteFolder(id: Id, deleteTabs = false): Promise<void> {
    const store = await this.repo.getStore();
    const folder = store.folders.find((f) => f.id === id);
    if (!folder) throw new Error("文件夹不存在");

    // 递归收集所有待删除的子文件夹 ID
    const folderIdsToDelete = new Set<Id>([id]);
    let added = true;
    while (added) {
      added = false;
      for (const f of store.folders) {
        if (f.parentId && folderIdsToDelete.has(f.parentId) && !folderIdsToDelete.has(f.id)) {
          folderIdsToDelete.add(f.id);
          added = true;
        }
      }
    }

    if (deleteTabs) {
      // 级联删除属于这些文件夹的标签和窗口
      store.tabs = store.tabs.filter((t) => !t.folderId || !folderIdsToDelete.has(t.folderId));
      store.windows = store.windows.filter((w) => !w.folderId || !folderIdsToDelete.has(w.folderId));
    } else {
      // 保留标签和窗口，移动到未分类 (folderId = null)
      for (const t of store.tabs) {
        if (t.folderId && folderIdsToDelete.has(t.folderId)) {
          t.folderId = null;
          t.updatedAt = now();
        }
      }
      for (const w of store.windows) {
        if (w.folderId && folderIdsToDelete.has(w.folderId)) {
          w.folderId = null;
          w.updatedAt = now();
        }
      }
    }

    // 移除文件夹
    store.folders = store.folders.filter((f) => !folderIdsToDelete.has(f.id));
    await this.repo.saveStore(store);
  }

  async moveTabToFolder(tabId: Id, targetFolderId: Id | null): Promise<SavedTab> {
    const store = await this.repo.getStore();
    const tab = store.tabs.find((t) => t.id === tabId);
    if (!tab) throw new Error("标签不存在");
    tab.folderId = targetFolderId;
    const existing = store.tabs.filter((t) => t.folderId === targetFolderId && t.id !== tabId);
    tab.sortOrder = existing.length;
    tab.updatedAt = now();
    await this.repo.saveStore(store);
    return tab;
  }

  async moveTabsToFolder(tabIds: Id[], targetFolderId: Id | null): Promise<void> {
    const store = await this.repo.getStore();
    const idSet = new Set(tabIds);
    const existingCount = store.tabs.filter(
      (t) => t.folderId === targetFolderId && !idSet.has(t.id),
    ).length;
    let added = 0;
    const timestamp = now();
    for (const tab of store.tabs) {
      if (idSet.has(tab.id)) {
        tab.folderId = targetFolderId;
        tab.sortOrder = existingCount + added;
        tab.updatedAt = timestamp;
        added++;
      }
    }
    await this.repo.saveStore(store);
  }

  async reorderTabs(orderedTabIds: Id[]): Promise<void> {
    const store = await this.repo.getStore();
    const idToIndex = new Map<Id, number>();
    orderedTabIds.forEach((id, index) => idToIndex.set(id, index));
    const timestamp = now();
    for (const tab of store.tabs) {
      if (idToIndex.has(tab.id)) {
        tab.sortOrder = idToIndex.get(tab.id);
        tab.updatedAt = timestamp;
      }
    }
    await this.repo.saveStore(store);
  }

  async reorderFolders(parentId: Id | null, orderedFolderIds: Id[]): Promise<void> {
    const store = await this.repo.getStore();
    const idToIndex = new Map<Id, number>();
    orderedFolderIds.forEach((id, index) => idToIndex.set(id, index));
    const timestamp = now();
    for (const folder of store.folders) {
      if (folder.parentId === parentId && idToIndex.has(folder.id)) {
        folder.sortOrder = idToIndex.get(folder.id)!;
        folder.updatedAt = timestamp;
      }
    }
    await this.repo.saveStore(store);
  }

  async moveFolder(
    sourceFolderId: Id,
    targetFolderId: Id,
    position: "before" | "after" | "inside" = "inside",
  ): Promise<Folder> {
    const store = await this.repo.getStore();
    const sourceFolder = store.folders.find((f) => f.id === sourceFolderId);
    const targetFolder = store.folders.find((f) => f.id === targetFolderId);
    if (!sourceFolder) throw new Error("源文件夹不存在");
    if (!targetFolder) throw new Error("目标文件夹不存在");

    if (sourceFolderId === targetFolderId) {
      return sourceFolder;
    }

    // 防止循环嵌套：targetFolder 不能是 sourceFolder 自身或其子孙文件夹
    let cur: Folder | undefined = targetFolder;
    while (cur) {
      if (cur.id === sourceFolderId) {
        throw new Error("不能将文件夹移动到其子文件夹中");
      }
      cur = cur.parentId ? store.folders.find((f) => f.id === cur?.parentId) : undefined;
    }

    const timestamp = now();

    if (position === "inside") {
      // 塞入目标文件夹内部
      sourceFolder.parentId = targetFolder.id;
      sourceFolder.updatedAt = timestamp;
      const siblings = store.folders
        .filter((f) => f.parentId === targetFolder.id && f.id !== sourceFolderId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      sourceFolder.sortOrder = siblings.length;
      await this.repo.saveStore(store);
      return sourceFolder;
    }

    // 同级排序：保持在 targetFolder 相同的父级目录下，插入在其前或后
    const targetParentId = targetFolder.parentId;
    sourceFolder.parentId = targetParentId;
    sourceFolder.updatedAt = timestamp;

    const siblings = store.folders
      .filter((f) => f.parentId === targetParentId && f.id !== sourceFolderId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const targetIdx = siblings.findIndex((f) => f.id === targetFolder.id);
    const insertIdx = position === "before" ? Math.max(0, targetIdx) : targetIdx + 1;

    siblings.splice(insertIdx, 0, sourceFolder);
    siblings.forEach((f, idx) => {
      f.sortOrder = idx;
    });

    await this.repo.saveStore(store);
    return sourceFolder;
  }

  async moveWindowToFolder(windowId: Id, targetFolderId: Id | null): Promise<SavedWindow> {
    const store = await this.repo.getStore();
    const win = store.windows.find((w) => w.id === windowId);
    if (!win) throw new Error("窗口不存在");
    win.folderId = targetFolderId;
    win.updatedAt = now();
    await this.repo.saveStore(store);
    return win;
  }

  async saveTab(input: {
    title: string;
    url: string;
    favIconUrl?: string;
    folderId?: Id | null;
    notes?: string;
    tags?: string[];
  }): Promise<SavedTab> {
    const store = await this.repo.getStore();
    const timestamp = now();
    const targetFolderId = input.folderId ?? null;
    const existingInFolder = store.tabs.filter((t) => t.folderId === targetFolderId);
    const tab: SavedTab = {
      id: createId(),
      folderId: targetFolderId,
      title: input.title,
      url: input.url,
      favIconUrl: input.favIconUrl,
      notes: input.notes,
      tags: input.tags ?? [],
      sortOrder: existingInFolder.length,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.tabs.push(tab);
    await this.repo.saveStore(store);
    return tab;
  }

  async saveCurrentTab(notes?: string, folderId?: Id | null): Promise<SavedTab> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      throw new Error("无法获取当前标签页，请先切换到普通网页");
    }
    if (!isSaveableUrl(tab.url)) {
      throw new Error("无法收藏浏览器内置页面，请切换到普通网页后再试");
    }
    return this.saveTab({
      title: tab.title ?? tab.url,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      folderId,
      notes,
    });
  }

  async saveWindow(input: {
    name: string;
    tabs: chrome.tabs.Tab[];
    folderId?: Id | null;
    notes?: string;
    tags?: string[];
  }): Promise<SavedWindow> {
    const store = await this.repo.getStore();
    const timestamp = now();
    const targetFolderId = input.folderId ?? null;
    const existingInFolder = store.windows.filter((w) => w.folderId === targetFolderId);
    const savedWindow: SavedWindow = {
      id: createId(),
      folderId: targetFolderId,
      name: input.name,
      notes: input.notes,
      tags: input.tags ?? [],
      sortOrder: existingInFolder.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      tabs: input.tabs
        .filter((t) => t.url)
        .map((t) => ({
          id: createId(),
          title: t.title ?? t.url!,
          url: t.url!,
          favIconUrl: t.favIconUrl,
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
    };
    store.windows.push(savedWindow);
    await this.repo.saveStore(store);
    return savedWindow;
  }

  async saveCurrentWindow(name?: string, folderId?: Id | null): Promise<SavedWindow> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const defaultName = `窗口 ${new Date().toLocaleString("zh-CN")}`;
    return this.saveWindow({
      name: name ?? defaultName,
      tabs,
      folderId,
    });
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.trim().toLowerCase();
    const store = await this.repo.getStore();
    if (!q) {
      return { tabs: store.tabs, windows: store.windows };
    }

    const match = (text?: string) => text?.toLowerCase().includes(q) ?? false;

    return {
      tabs: store.tabs.filter(
        (t) =>
          match(t.title) ||
          match(t.url) ||
          match(t.notes) ||
          t.tags.some((tag) => match(tag)),
      ),
      windows: store.windows.filter(
        (w) =>
          match(w.name) ||
          match(w.notes) ||
          w.tags.some((tag) => match(tag)) ||
          w.tabs.some((t) => match(t.title) || match(t.url)),
      ),
    };
  }

  async restoreTab(tabId: Id): Promise<void> {
    const store = await this.repo.getStore();
    const tab = store.tabs.find((t) => t.id === tabId);
    if (!tab) throw new Error("标签不存在");
    await chrome.tabs.create({ url: tab.url, active: true });
  }

  async restoreWindow(windowId: Id): Promise<void> {
    const store = await this.repo.getStore();
    const saved = store.windows.find((w) => w.id === windowId);
    if (!saved) throw new Error("窗口不存在");
    for (const tab of saved.tabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
  }

  async deleteTab(tabId: Id): Promise<void> {
    const store = await this.repo.getStore();
    store.tabs = store.tabs.filter((t) => t.id !== tabId);
    await this.repo.saveStore(store);
  }

  async deleteWindow(windowId: Id): Promise<void> {
    const store = await this.repo.getStore();
    store.windows = store.windows.filter((w) => w.id !== windowId);
    await this.repo.saveStore(store);
  }

  async updateTabNotes(tabId: Id, notes: string): Promise<SavedTab> {
    const store = await this.repo.getStore();
    const tab = store.tabs.find((t) => t.id === tabId);
    if (!tab) throw new Error("标签不存在");
    tab.notes = notes;
    tab.updatedAt = now();
    await this.repo.saveStore(store);
    return tab;
  }

  async exportData(): Promise<PageBoxExport> {
    const store = await this.repo.getStore();
    return { exportedAt: now(), store };
  }

  async importData(data: PageBoxExport, merge = false): Promise<void> {
    if (merge) {
      const current = await this.repo.getStore();
      const merged: PageBoxStore = {
        version: 1,
        folders: [...current.folders, ...data.store.folders],
        tabs: [...current.tabs, ...data.store.tabs],
        windows: [...current.windows, ...data.store.windows],
      };
      await this.repo.saveStore(merged);
    } else {
      await this.repo.saveStore(data.store);
    }
  }
}

export const pageBoxService = new PageBoxService();
export { BookmarkSyncService, bookmarkSyncService } from "./bookmark-sync";
export type { SyncToBrowserOptions } from "./bookmark-sync";


/** 打开或激活全屏管理大页 */
export async function openManagerPage(): Promise<void> {
  const url = chrome.runtime.getURL("manager.html");
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((t) => t.url === url || t.url?.startsWith(url));
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId !== undefined) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url, active: true });
  }
}
