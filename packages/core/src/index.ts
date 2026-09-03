import type {
  Folder,
  Id,
  PageBoxExport,
  PageBoxStore,
  SavedTab,
  SavedWindow,
  SearchResult,
} from "@pagebox/types";
import { LocalStorageRepository, storageRepository } from "@pagebox/storage";

const DEFAULT_BAR_ID = "1";

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
  constructor(private readonly repo: LocalStorageRepository = storageRepository) {}

  /**
   * 从浏览器原生书签树获取全量结构，并合并扩展元数据
   */
  async getStore(): Promise<PageBoxStore> {
    const [root] = await chrome.bookmarks.getTree();
    const metadataMap = await this.repo.getAllMetadata();
    const folders: Folder[] = [];
    const tabs: SavedTab[] = [];

    const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[], parentFolderId: Id | null) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const order = typeof node.index === "number" ? node.index : i;

        if (node.url) {
          // 书签项
          if (!isSaveableUrl(node.url)) continue;
          const meta = metadataMap[node.id];
          tabs.push({
            id: node.id,
            folderId: parentFolderId,
            title: node.title || node.url,
            url: node.url,
            favIconUrl: meta?.favIconUrl,
            notes: meta?.notes,
            tags: meta?.tags ?? [],
            bookmarkId: node.id,
            sortOrder: order,
            createdAt: node.dateAdded ?? now(),
            updatedAt: node.dateAdded ?? now(),
          });
        } else {
          // 文件夹节点
          // Chrome 书签树顶层根节点 id: "0" 虚拟跳过，只递归子项
          if (node.id === "0") {
            if (node.children?.length) {
              walk(node.children, null);
            }
            continue;
          }

          const folder: Folder = {
            id: node.id,
            // 顶层文件夹（如书签栏 id: "1"、其他书签 id: "2"）在 Chrome 下 parentId 是 "0"，在插件内视作根目录 null
            parentId: parentFolderId,
            name: node.title || "未命名文件夹",
            bookmarkId: node.id,
            sortOrder: order,
            createdAt: node.dateAdded ?? now(),
            updatedAt: node.dateGroupModified ?? node.dateAdded ?? now(),
          };
          folders.push(folder);

          if (node.children?.length) {
            walk(node.children, folder.id);
          }
        }
      }
    };

    if (root) {
      walk([root], null);
    }

    const windows = await this.repo.getWindows();

    return {
      version: 1,
      folders,
      tabs,
      windows,
    };
  }

  /**
   * 在浏览器书签中创建文件夹
   */
  async createFolder(name: string, parentId: Id | null = null): Promise<Folder> {
    const targetParentId = parentId ?? DEFAULT_BAR_ID;
    const created = await chrome.bookmarks.create({
      parentId: targetParentId,
      title: name.trim() || "新建文件夹",
    });

    return {
      id: created.id,
      parentId: created.parentId === "0" ? null : (created.parentId ?? null),
      name: created.title,
      sortOrder: created.index ?? 0,
      bookmarkId: created.id,
      createdAt: created.dateAdded ?? now(),
      updatedAt: created.dateGroupModified ?? created.dateAdded ?? now(),
    };
  }

  /**
   * 重命名浏览器书签文件夹
   */
  async renameFolder(id: Id, name: string): Promise<Folder> {
    if (id === "0" || id === "1" || id === "2") {
      throw new Error("浏览器系统根文件夹不可重命名");
    }
    const updated = await chrome.bookmarks.update(id, {
      title: name.trim(),
    });

    return {
      id: updated.id,
      parentId: updated.parentId === "0" ? null : (updated.parentId ?? null),
      name: updated.title,
      sortOrder: updated.index ?? 0,
      bookmarkId: updated.id,
      createdAt: updated.dateAdded ?? now(),
      updatedAt: updated.dateGroupModified ?? updated.dateAdded ?? now(),
    };
  }

  /**
   * 删除浏览器书签文件夹
   */
  async deleteFolder(id: Id, deleteTabs = false): Promise<void> {
    if (id === "0" || id === "1" || id === "2") {
      throw new Error("浏览器系统根文件夹不可删除");
    }

    if (deleteTabs) {
      await chrome.bookmarks.removeTree(id);
    } else {
      // 保持内部内容：将其移动到父级目录后再删除本文件夹
      const [folder] = await chrome.bookmarks.get(id);
      const targetParentId =
        folder?.parentId && folder.parentId !== "0" ? folder.parentId : DEFAULT_BAR_ID;
      const children = await chrome.bookmarks.getChildren(id);
      for (const child of children) {
        await chrome.bookmarks.move(child.id, { parentId: targetParentId });
      }
      await chrome.bookmarks.remove(id);
    }
  }

  /**
   * 移动单个标签至目标文件夹
   */
  async moveTabToFolder(tabId: Id, targetFolderId: Id | null): Promise<SavedTab> {
    const targetParentId = targetFolderId ?? DEFAULT_BAR_ID;
    const moved = await chrome.bookmarks.move(tabId, { parentId: targetParentId });
    const meta = await this.repo.getMetadata(tabId);

    return {
      id: moved.id,
      folderId: moved.parentId === "0" ? null : (moved.parentId ?? null),
      title: moved.title || moved.url || "",
      url: moved.url || "",
      favIconUrl: meta?.favIconUrl,
      notes: meta?.notes,
      tags: meta?.tags ?? [],
      bookmarkId: moved.id,
      sortOrder: moved.index ?? 0,
      createdAt: moved.dateAdded ?? now(),
      updatedAt: moved.dateAdded ?? now(),
    };
  }

  /**
   * 批量移动标签至目标文件夹
   */
  async moveTabsToFolder(tabIds: Id[], targetFolderId: Id | null): Promise<void> {
    const targetParentId = targetFolderId ?? DEFAULT_BAR_ID;
    for (const tabId of tabIds) {
      await chrome.bookmarks.move(tabId, { parentId: targetParentId });
    }
  }

  /**
   * 调整标签排序序号
   */
  async reorderTabs(orderedTabIds: Id[]): Promise<void> {
    for (let i = 0; i < orderedTabIds.length; i++) {
      await chrome.bookmarks.move(orderedTabIds[i], { index: i });
    }
  }

  /**
   * 调整文件夹排序序号
   */
  async reorderFolders(_parentId: Id | null, orderedFolderIds: Id[]): Promise<void> {
    for (let i = 0; i < orderedFolderIds.length; i++) {
      await chrome.bookmarks.move(orderedFolderIds[i], { index: i });
    }
  }

  /**
   * 拖拽调整文件夹层级或排序
   */
  async moveFolder(
    sourceFolderId: Id,
    targetFolderId: Id,
    position: "before" | "after" | "inside" = "inside",
  ): Promise<Folder> {
    if (sourceFolderId === targetFolderId) {
      const [curr] = await chrome.bookmarks.get(sourceFolderId);
      return {
        id: curr.id,
        parentId: curr.parentId === "0" ? null : (curr.parentId ?? null),
        name: curr.title,
        sortOrder: curr.index ?? 0,
        bookmarkId: curr.id,
        createdAt: curr.dateAdded ?? now(),
        updatedAt: curr.dateGroupModified ?? curr.dateAdded ?? now(),
      };
    }

    if (sourceFolderId === "0" || sourceFolderId === "1" || sourceFolderId === "2") {
      throw new Error("浏览器系统根文件夹不可移动");
    }

    if (position === "inside") {
      const moved = await chrome.bookmarks.move(sourceFolderId, {
        parentId: targetFolderId,
      });
      return {
        id: moved.id,
        parentId: moved.parentId === "0" ? null : (moved.parentId ?? null),
        name: moved.title,
        sortOrder: moved.index ?? 0,
        bookmarkId: moved.id,
        createdAt: moved.dateAdded ?? now(),
        updatedAt: moved.dateGroupModified ?? moved.dateAdded ?? now(),
      };
    }

    const [targetNode] = await chrome.bookmarks.get(targetFolderId);
    const targetParentId =
      targetNode.parentId && targetNode.parentId !== "0" ? targetNode.parentId : DEFAULT_BAR_ID;
    const targetIndex =
      position === "before" ? Math.max(0, targetNode.index ?? 0) : (targetNode.index ?? 0) + 1;

    const moved = await chrome.bookmarks.move(sourceFolderId, {
      parentId: targetParentId,
      index: targetIndex,
    });

    return {
      id: moved.id,
      parentId: moved.parentId === "0" ? null : (moved.parentId ?? null),
      name: moved.title,
      sortOrder: moved.index ?? 0,
      bookmarkId: moved.id,
      createdAt: moved.dateAdded ?? now(),
      updatedAt: moved.dateGroupModified ?? moved.dateAdded ?? now(),
    };
  }

  /**
   * 移动窗口到指定文件夹
   */
  async moveWindowToFolder(windowId: Id, targetFolderId: Id | null): Promise<SavedWindow> {
    const windows = await this.repo.getWindows();
    const win = windows.find((w) => w.id === windowId);
    if (!win) throw new Error("窗口不存在");
    win.folderId = targetFolderId;
    win.updatedAt = now();
    await this.repo.saveWindows(windows);
    return win;
  }

  /**
   * 保存单个网页到浏览器书签，并绑定元数据
   */
  async saveTab(input: {
    title: string;
    url: string;
    favIconUrl?: string;
    folderId?: Id | null;
    notes?: string;
    tags?: string[];
  }): Promise<SavedTab> {
    const targetParentId = input.folderId ?? DEFAULT_BAR_ID;
    const created = await chrome.bookmarks.create({
      parentId: targetParentId,
      title: input.title,
      url: input.url,
    });

    if (input.notes || (input.tags && input.tags.length > 0) || input.favIconUrl) {
      await this.repo.setMetadata(created.id, {
        notes: input.notes,
        tags: input.tags,
        favIconUrl: input.favIconUrl,
      });
    }

    return {
      id: created.id,
      folderId: created.parentId === "0" ? null : (created.parentId ?? null),
      title: created.title || created.url || "",
      url: created.url || "",
      favIconUrl: input.favIconUrl,
      notes: input.notes,
      tags: input.tags ?? [],
      bookmarkId: created.id,
      sortOrder: created.index ?? 0,
      createdAt: created.dateAdded ?? now(),
      updatedAt: created.dateAdded ?? now(),
    };
  }

  /**
   * 收藏当前浏览器活跃标签页
   */
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

  /**
   * 收藏一组标签页为窗口快照
   */
  async saveWindow(input: {
    name: string;
    tabs: chrome.tabs.Tab[];
    folderId?: Id | null;
    notes?: string;
    tags?: string[];
  }): Promise<SavedWindow> {
    const windows = await this.repo.getWindows();
    const timestamp = now();
    const targetFolderId = input.folderId ?? null;
    const existingInFolder = windows.filter((w) => w.folderId === targetFolderId);

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
        .filter((t) => t.url && isSaveableUrl(t.url))
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

    windows.push(savedWindow);
    await this.repo.saveWindows(windows);
    return savedWindow;
  }

  /**
   * 收藏当前窗口所有网页
   */
  async saveCurrentWindow(name?: string, folderId?: Id | null): Promise<SavedWindow> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const defaultName = `窗口 ${new Date().toLocaleString("zh-CN")}`;
    return this.saveWindow({
      name: name ?? defaultName,
      tabs,
      folderId,
    });
  }

  /**
   * 全文搜索（标题、URL、备注、标签）
   */
  async search(query: string): Promise<SearchResult> {
    const q = query.trim().toLowerCase();
    const store = await this.getStore();
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

  /**
   * 在新标签页打开保存的书签
   */
  async restoreTab(tabId: Id): Promise<void> {
    const [node] = await chrome.bookmarks.get(tabId);
    if (node?.url) {
      await chrome.tabs.create({ url: node.url, active: true });
    }
  }

  /**
   * 恢复窗口内全部标签页
   */
  async restoreWindow(windowId: Id): Promise<void> {
    const windows = await this.repo.getWindows();
    const saved = windows.find((w) => w.id === windowId);
    if (!saved) throw new Error("窗口不存在");
    for (const tab of saved.tabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
  }

  /**
   * 删除书签及关联元数据
   */
  async deleteTab(tabId: Id): Promise<void> {
    await chrome.bookmarks.remove(tabId);
    await this.repo.removeMetadata(tabId);
  }

  /**
   * 删除窗口快照
   */
  async deleteWindow(windowId: Id): Promise<void> {
    const windows = await this.repo.getWindows();
    const filtered = windows.filter((w) => w.id !== windowId);
    await this.repo.saveWindows(filtered);
  }

  /**
   * 更新书签备注
   */
  async updateTabNotes(tabId: Id, notes: string): Promise<SavedTab> {
    await this.repo.setMetadata(tabId, { notes });
    const [node] = await chrome.bookmarks.get(tabId);
    const meta = await this.repo.getMetadata(tabId);

    return {
      id: node.id,
      folderId: node.parentId === "0" ? null : (node.parentId ?? null),
      title: node.title || node.url || "",
      url: node.url || "",
      favIconUrl: meta?.favIconUrl,
      notes: meta?.notes,
      tags: meta?.tags ?? [],
      bookmarkId: node.id,
      sortOrder: node.index ?? 0,
      createdAt: node.dateAdded ?? now(),
      updatedAt: node.dateAdded ?? now(),
    };
  }

  /**
   * 导出备份数据
   */
  async exportData(): Promise<PageBoxExport> {
    const store = await this.getStore();
    return { exportedAt: now(), store };
  }

  /**
   * 导入备份数据
   */
  async importData(data: PageBoxExport, merge = true): Promise<void> {
    // 恢复窗口快照
    if (data.store.windows?.length) {
      const currentWindows = await this.repo.getWindows();
      if (merge) {
        await this.repo.saveWindows([...currentWindows, ...data.store.windows]);
      } else {
        await this.repo.saveWindows(data.store.windows);
      }
    }

    // 建立导入专用目录，保障用户既有书签不受破坏
    const importFolderName = `PageBox 导入 (${new Date().toLocaleDateString("zh-CN")})`;
    const rootFolder = await chrome.bookmarks.create({
      parentId: DEFAULT_BAR_ID,
      title: importFolderName,
    });

    const folderIdMap = new Map<Id, string>();

    // 递归写入导入的文件夹
    for (const folder of data.store.folders) {
      const parentId = folder.parentId
        ? folderIdMap.get(folder.parentId) ?? rootFolder.id
        : rootFolder.id;
      const createdFolder = await chrome.bookmarks.create({
        parentId,
        title: folder.name,
      });
      folderIdMap.set(folder.id, createdFolder.id);
    }

    // 写入标签并恢复备注/标签元数据
    for (const tab of data.store.tabs) {
      if (!tab.url || !isSaveableUrl(tab.url)) continue;
      const parentId = tab.folderId
        ? folderIdMap.get(tab.folderId) ?? rootFolder.id
        : rootFolder.id;
      const createdTab = await chrome.bookmarks.create({
        parentId,
        title: tab.title || tab.url,
        url: tab.url,
      });

      if (tab.notes || (tab.tags && tab.tags.length > 0) || tab.favIconUrl) {
        await this.repo.setMetadata(createdTab.id, {
          notes: tab.notes,
          tags: tab.tags,
          favIconUrl: tab.favIconUrl,
        });
      }
    }
  }
}

export const pageBoxService = new PageBoxService();

/**
 * 监听浏览器原生书签与扩展元数据的实时变动
 */
export function subscribeToBookmarks(listener: () => void): () => void {
  const onBookmarksChanged = () => listener();
  const onStorageChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === "local" && (changes.pagebox_metadata || changes.pagebox_windows)) {
      listener();
    }
  };

  chrome.bookmarks.onCreated.addListener(onBookmarksChanged);
  chrome.bookmarks.onRemoved.addListener(onBookmarksChanged);
  chrome.bookmarks.onChanged.addListener(onBookmarksChanged);
  chrome.bookmarks.onMoved.addListener(onBookmarksChanged);
  chrome.bookmarks.onChildrenReordered.addListener(onBookmarksChanged);
  chrome.storage.onChanged.addListener(onStorageChanged);

  return () => {
    chrome.bookmarks.onCreated.removeListener(onBookmarksChanged);
    chrome.bookmarks.onRemoved.removeListener(onBookmarksChanged);
    chrome.bookmarks.onChanged.removeListener(onBookmarksChanged);
    chrome.bookmarks.onMoved.removeListener(onBookmarksChanged);
    chrome.bookmarks.onChildrenReordered.removeListener(onBookmarksChanged);
    chrome.storage.onChanged.removeListener(onStorageChanged);
  };
}

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
