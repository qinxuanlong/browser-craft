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
    const tab: SavedTab = {
      id: createId(),
      folderId: input.folderId ?? null,
      title: input.title,
      url: input.url,
      favIconUrl: input.favIconUrl,
      notes: input.notes,
      tags: input.tags ?? [],
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
    const savedWindow: SavedWindow = {
      id: createId(),
      folderId: input.folderId ?? null,
      name: input.name,
      notes: input.notes,
      tags: input.tags ?? [],
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
