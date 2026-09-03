import type {
  BookmarkPushResult,
  BookmarkSyncResult,
  Folder,
  Id,
  PageBoxStore,
  SavedTab,
} from "@pagebox/types";
import { LocalStorageRepository } from "@pagebox/storage";

const BOOKMARK_TAG = "浏览器书签";

export interface SyncToBrowserOptions {
  /** 浏览器书签根文件夹名称，默认为 "PageBox 收藏" */
  targetFolderName?: string;
  /** 是否包含从浏览器导入进来的书签（默认 false，仅导出 PageBox 原生标签） */
  includeImported?: boolean;
}

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

function clearSyncedItems(store: PageBoxStore): void {
  store.tabs = store.tabs.filter((tab) => !tab.bookmarkId);
  store.folders = store.folders.filter((folder) => !folder.bookmarkId);
}

export class BookmarkSyncService {
  constructor(private readonly storeRepo = new LocalStorageRepository()) {}

  /** 手动从浏览器书签全量同步（浏览器 ➔ 插件） */
  async syncFromBrowser(): Promise<BookmarkSyncResult> {
    const store = await this.storeRepo.getStore();
    clearSyncedItems(store);

    const [tree] = await chrome.bookmarks.getTree();
    let imported = 0;
    let skipped = 0;
    let folders = 0;

    const walk = (
      nodes: chrome.bookmarks.BookmarkTreeNode[],
      parentFolderId: Id | null,
    ) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const order = typeof node.index === "number" ? node.index : i;
        if (node.url) {
          if (!isSaveableUrl(node.url)) {
            skipped++;
            continue;
          }
          const timestamp = now();
          store.tabs.push({
            id: createId(),
            bookmarkId: node.id,
            folderId: parentFolderId,
            title: node.title || node.url,
            url: node.url,
            tags: [BOOKMARK_TAG],
            sortOrder: order,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          imported++;
          continue;
        }

        if (node.children !== undefined) {
          const timestamp = now();
          const folder: Folder = {
            id: createId(),
            bookmarkId: node.id,
            parentId: parentFolderId,
            name: node.title || "未命名文件夹",
            sortOrder: order,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          store.folders.push(folder);
          folders++;
          if (node.children.length > 0) {
            walk(node.children, folder.id);
          }
        }
      }
    };

    if (tree.children?.length) {
      walk(tree.children, null);
    }

    await this.storeRepo.saveStore(store);
    return { imported, skipped, folders };
  }

  /**
   * 将 PageBox 中的收藏全量覆盖写入到浏览器书签中（插件 ➔ 浏览器 全量覆盖）
   * 严格保留标签与子文件夹的原生位置顺序
   */
  async syncToBrowser(): Promise<BookmarkPushResult> {
    // 1. 获取浏览器书签根树
    const [tree] = await chrome.bookmarks.getTree();
    if (!tree?.children?.length) {
      throw new Error("无法读取浏览器书签树");
    }

    // 在 Chromium (Chrome / Edge) 中：
    // tree.children[0] 为书签栏（Bookmarks bar / 收藏夹栏，通常 id="1"）
    // tree.children[1] 为其他书签（Other bookmarks / 其他收藏夹，通常 id="2"）
    const barNode = tree.children[0];
    const otherNode = tree.children.length > 1 ? tree.children[1] : undefined;

    // 清空节点下所有旧子项辅助方法
    const clearNodeChildren = async (parentId: string) => {
      const children = await chrome.bookmarks.getChildren(parentId);
      for (const child of children) {
        if (child.url) {
          await chrome.bookmarks.remove(child.id);
        } else {
          await chrome.bookmarks.removeTree(child.id);
        }
      }
    };

    // 2. 清空浏览器现有书签栏与其他书签下的旧内容
    await clearNodeChildren(barNode.id);
    if (otherNode) {
      await clearNodeChildren(otherNode.id);
    }

    // 3. 读取本地 PageBox 存储
    const store = await this.storeRepo.getStore();
    let foldersCreated = 0;
    let bookmarksCreated = 0;

    // 4. 识别 PageBox 中对应浏览器根目录的文件夹
    const isBarFolder = (f: Folder) =>
      f.bookmarkId === barNode.id ||
      f.name === "收藏夹栏" ||
      f.name === "书签栏" ||
      f.name.toLowerCase() === "bookmarks bar" ||
      f.name.toLowerCase() === "favorites bar";

    const isOtherFolder = (f: Folder) =>
      Boolean(otherNode) &&
      (f.bookmarkId === otherNode!.id ||
        f.name === "其他收藏夹" ||
        f.name === "其他书签" ||
        f.name.toLowerCase() === "other bookmarks" ||
        f.name.toLowerCase() === "other favorites");

    const rootBarFolder = store.folders.find((f) => f.parentId === null && isBarFolder(f));
    const rootOtherFolder = store.folders.find((f) => f.parentId === null && isOtherFolder(f));

    if (rootBarFolder) rootBarFolder.bookmarkId = barNode.id;
    if (rootOtherFolder && otherNode) rootOtherFolder.bookmarkId = otherNode.id;

    type SiblingItem =
      | { type: "tab"; tab: SavedTab; sortOrder: number }
      | { type: "folder"; folder: Folder; sortOrder: number };

    // 递归按顺序写入指定目录下的所有标签与子文件夹（保持原生顺序与相对交错排布）
    const writeFolderChildren = async (folderId: Id, chromeParentId: string) => {
      const directTabs = store.tabs.filter((t) => t.folderId === folderId);
      const childFolders = store.folders.filter((f) => f.parentId === folderId);

      const siblings: SiblingItem[] = [
        ...directTabs.map((t, idx) => ({
          type: "tab" as const,
          tab: t,
          sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : idx,
        })),
        ...childFolders.map((f, idx) => ({
          type: "folder" as const,
          folder: f,
          sortOrder: typeof f.sortOrder === "number" ? f.sortOrder : idx,
        })),
      ];

      siblings.sort((a, b) => a.sortOrder - b.sortOrder);

      for (let i = 0; i < siblings.length; i++) {
        const entry = siblings[i];
        if (entry.type === "tab") {
          const tab = entry.tab;
          if (tab.url && isSaveableUrl(tab.url)) {
            const created = await chrome.bookmarks.create({
              parentId: chromeParentId,
              index: i,
              title: tab.title || tab.url,
              url: tab.url,
            });
            tab.bookmarkId = created.id;
            tab.sortOrder = i;
            bookmarksCreated++;
          }
        } else {
          const childFolder = entry.folder;
          const createdFolder = await chrome.bookmarks.create({
            parentId: chromeParentId,
            index: i,
            title: childFolder.name,
          });
          childFolder.bookmarkId = createdFolder.id;
          childFolder.sortOrder = i;
          foldersCreated++;
          await writeFolderChildren(childFolder.id, createdFolder.id);
        }
      }
    };

    // 5. 重建书签栏 / 收藏夹栏
    if (rootBarFolder) {
      await writeFolderChildren(rootBarFolder.id, barNode.id);
    }

    // 6. 重建其他书签 / 其他收藏夹
    if (rootOtherFolder && otherNode) {
      await writeFolderChildren(rootOtherFolder.id, otherNode.id);
    }

    // 7. 处理既不属于 rootBarFolder 也不属于 rootOtherFolder 的其它独立根文件夹与未分类标签
    const otherRootFolders = store.folders.filter(
      (f) => f.parentId === null && f.id !== rootBarFolder?.id && f.id !== rootOtherFolder?.id,
    );
    const uncategorizedTabs = store.tabs.filter((t) => t.folderId === null);

    const rootSiblings: SiblingItem[] = [
      ...otherRootFolders.map((f, idx) => ({
        type: "folder" as const,
        folder: f,
        sortOrder: typeof f.sortOrder === "number" ? f.sortOrder : idx,
      })),
      ...uncategorizedTabs.map((t, idx) => ({
        type: "tab" as const,
        tab: t,
        sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : idx,
      })),
    ];
    rootSiblings.sort((a, b) => a.sortOrder - b.sortOrder);

    for (let i = 0; i < rootSiblings.length; i++) {
      const entry = rootSiblings[i];
      if (entry.type === "tab") {
        const tab = entry.tab;
        if (tab.url && isSaveableUrl(tab.url)) {
          const created = await chrome.bookmarks.create({
            parentId: barNode.id,
            title: tab.title || tab.url,
            url: tab.url,
          });
          tab.bookmarkId = created.id;
          tab.sortOrder = i;
          bookmarksCreated++;
        }
      } else {
        const folder = entry.folder;
        const createdFolder = await chrome.bookmarks.create({
          parentId: barNode.id,
          title: folder.name,
        });
        folder.bookmarkId = createdFolder.id;
        folder.sortOrder = i;
        foldersCreated++;
        await writeFolderChildren(folder.id, createdFolder.id);
      }
    }

    // 8. 更新本地存储中的 bookmarkId 与最新排序映射
    await this.storeRepo.saveStore(store);

    return {
      foldersCreated,
      bookmarksCreated,
      rootFolderTitle: "浏览器书签栏与其他书签",
    };
  }
}

export const bookmarkSyncService = new BookmarkSyncService();


