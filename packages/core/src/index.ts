import type {
  DeadLinkResult,
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

export function isSaveableUrl(url: string): boolean {
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
            visitCount: meta?.visitCount ?? 0,
            lastVisitedAt: meta?.lastVisitedAt,
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
      await this.recordTabVisit(tabId);
    }
  }

  /**
   * 记录书签访问（递增访问次数与最后访问时间）
   */
  async recordTabVisit(tabId: Id): Promise<void> {
    await this.repo.recordVisit(tabId);
  }

  /**
   * 批量删除书签及关联元数据
   */
  async batchDeleteTabs(tabIds: Id[]): Promise<void> {
    for (const id of tabIds) {
      try {
        await this.deleteTab(id);
      } catch (e) {
        console.error(`删除书签 ${id} 失败:`, e);
      }
    }
  }

  /**
   * 批量删除文件夹
   */
  async batchDeleteFolders(folderIds: Id[]): Promise<void> {
    for (const id of folderIds) {
      try {
        await this.deleteFolder(id, true);
      } catch (e) {
        console.error(`删除文件夹 ${id} 失败:`, e);
      }
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

export * from "./license";
export { LocalStorageRepository, storageRepository } from "@pagebox/storage";

/**
 * 监听标签页事件时，自动同步 Favicon 到已保存的书签元数据或窗口快照中
 */
export async function syncTabFavicon(url: string, favIconUrl: string): Promise<void> {
  if (!url || !favIconUrl || !isSaveableUrl(url)) return;
  // 排除浏览器内置系统页面图标
  if (
    favIconUrl.startsWith("chrome://") ||
    favIconUrl.startsWith("edge://") ||
    favIconUrl.startsWith("chrome-extension://")
  ) {
    return;
  }

  try {
    // 1. 同步到浏览器书签对应的元数据
    if (typeof chrome !== "undefined" && chrome.bookmarks?.search) {
      const bookmarks = await chrome.bookmarks.search({ url });
      if (bookmarks && bookmarks.length > 0) {
        for (const bm of bookmarks) {
          const meta = await storageRepository.getMetadata(bm.id);
          if (!meta?.favIconUrl) {
            await storageRepository.setMetadata(bm.id, { favIconUrl });
          }
        }
      }
    }

    // 2. 同步到已保存的窗口快照
    const windows = await storageRepository.getWindows();
    let windowsChanged = false;
    for (const win of windows) {
      for (const tab of win.tabs) {
        if (tab.url === url && !tab.favIconUrl) {
          tab.favIconUrl = favIconUrl;
          windowsChanged = true;
        }
      }
    }
    if (windowsChanged) {
      await storageRepository.saveWindows(windows);
    }
  } catch (error) {
    console.error("同步 Favicon 失败:", error);
  }
}

/**
 * 查找空文件夹（不含任何书签，且子孙文件夹也均为空的目录）
 * 排除系统内置根文件夹（0, 1, 2, 3 等）
 */
export function findEmptyFolders(folders: Folder[], tabs: SavedTab[]): Folder[] {
  const systemFolderIds = new Set(["0", "1", "2", "3"]);

  // 建立 folderId -> 直接包含的 tab 数量
  const tabCountMap = new Map<Id, number>();
  for (const tab of tabs) {
    if (tab.folderId) {
      tabCountMap.set(tab.folderId, (tabCountMap.get(tab.folderId) ?? 0) + 1);
    }
  }

  // 建立 parentId -> 子文件夹列表
  const childrenMap = new Map<Id, Folder[]>();
  for (const folder of folders) {
    if (folder.parentId) {
      const list = childrenMap.get(folder.parentId) ?? [];
      list.push(folder);
      childrenMap.set(folder.parentId, list);
    }
  }

  // 递归计算某个文件夹及其所有子孙文件夹的总 tab 数
  const totalDescendantTabsMap = new Map<Id, number>();
  function countTotalTabs(folderId: Id): number {
    if (totalDescendantTabsMap.has(folderId)) {
      return totalDescendantTabsMap.get(folderId)!;
    }
    let count = tabCountMap.get(folderId) ?? 0;
    const children = childrenMap.get(folderId) ?? [];
    for (const child of children) {
      count += countTotalTabs(child.id);
    }
    totalDescendantTabsMap.set(folderId, count);
    return count;
  }

  return folders.filter((folder) => {
    if (systemFolderIds.has(folder.id)) return false;
    return countTotalTabs(folder.id) === 0;
  });
}

/**
 * 探测单个书签链接可用性
 * 1. 优先通过 chrome.runtime.sendMessage 发送到 Background Service Worker（具备 host_permissions 豁免跨域限制）
 * 2. 如果后台无响应或在普通前端环境，降级执行带 no-cors 兜底的连通性探测，彻底杜绝因同源策略导致的误判
 */
async function probeSingleUrl(
  url: string,
  timeoutMs = 6000
): Promise<{ ok: boolean; status?: number; error?: string }> {
  // 1. 尝试委托 Background Service Worker 处理
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    try {
      const bgResult = await new Promise<{ ok: boolean; status?: number; error?: string } | null>((resolve) => {
        const timer = setTimeout(() => resolve(null), timeoutMs + 1000);
        chrome.runtime.sendMessage(
          { type: "PAGEBOX_CHECK_URL", url, timeoutMs },
          (response) => {
            clearTimeout(timer);
            if (chrome.runtime.lastError || !response) {
              resolve(null);
            } else {
              resolve(response);
            }
          }
        );
      });
      if (bgResult !== null) {
        return bgResult;
      }
    } catch {
      // 降级使用本地探测
    }
  }

  // 2. 本地探测（前台环境兜底）
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res: Response | null = null;
    try {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });
    } catch {
      if (controller.signal.aborted) {
        return { ok: false, error: "请求超时 (6秒无响应)" };
      }
      // 关键防误判机制：若因未配置 CORS 响应头导致 fetch 报错，使用 mode: "no-cors" 检验真实网络可达性
      try {
        await fetch(url, {
          method: "GET",
          mode: "no-cors",
          signal: controller.signal,
        });
        // 成功建立网络连接并获得响应，说明服务器存活，并非死链
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: controller.signal.aborted ? "请求超时" : "无法连接 / 域名无法解析",
        };
      }
    } finally {
      clearTimeout(timer);
    }

    if (res) {
      // 401/403 表示页面存在但需要登录/权限（如内网系统），并非死链
      if (res.status === 401 || res.status === 403) {
        return { ok: true, status: res.status };
      }
      if (res.status >= 400) {
        return {
          ok: false,
          status: res.status,
          error: `HTTP ${res.status} (${res.statusText || "访问出错"})`,
        };
      }
      return { ok: true, status: res.status };
    }

    return { ok: true };
  } catch {
    clearTimeout(timer);
    return { ok: false, error: "网络连接异常" };
  }
}

/**
 * 批量探测书签链接可用性（检测 404 / 500 / 域名失效 / 连接超时等）
 * 支持并发控制与进度回调
 */
export async function checkDeadLinks(
  tabs: SavedTab[],
  onProgress?: (checked: number, total: number) => void,
  concurrency = 5
): Promise<DeadLinkResult[]> {
  // 仅对有效 http / https 链接探测
  const validTabs = tabs.filter((t) => {
    try {
      const url = new URL(t.url);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  });

  const total = validTabs.length;
  if (total === 0) return [];

  let checked = 0;
  const deadLinks: DeadLinkResult[] = [];

  async function testTab(tab: SavedTab): Promise<DeadLinkResult | null> {
    const result = await probeSingleUrl(tab.url, 6000);
    if (!result.ok) {
      return {
        tabId: tab.id,
        url: tab.url,
        title: tab.title,
        status: result.status,
        error: result.error || "无法访问",
      };
    }
    return null;
  }

  let currentIndex = 0;
  async function worker() {
    while (currentIndex < validTabs.length) {
      const index = currentIndex++;
      const tab = validTabs[index];
      const result = await testTab(tab);
      if (result) {
        deadLinks.push(result);
      }
      checked++;
      onProgress?.(checked, total);
    }
  }

  const poolSize = Math.min(concurrency, validTabs.length);
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);

  return deadLinks;
}

