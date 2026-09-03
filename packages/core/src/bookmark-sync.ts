import type { BookmarkSyncResult, Folder, Id, PageBoxStore } from "@pagebox/types";
import { LocalStorageRepository } from "@pagebox/storage";

const BOOKMARK_TAG = "浏览器书签";

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

  /** 手动从浏览器书签全量同步（单向，不写回浏览器） */
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
      for (const node of nodes) {
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
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          imported++;
          continue;
        }

        if (!node.children?.length) continue;

        const timestamp = now();
        const folder: Folder = {
          id: createId(),
          bookmarkId: node.id,
          parentId: parentFolderId,
          name: node.title || "未命名文件夹",
          sortOrder: store.folders.filter((f) => f.parentId === parentFolderId).length,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        store.folders.push(folder);
        folders++;
        walk(node.children, folder.id);
      }
    };

    if (tree.children?.length) {
      walk(tree.children, null);
    }

    await this.storeRepo.saveStore(store);
    return { imported, skipped, folders };
  }
}

export const bookmarkSyncService = new BookmarkSyncService();
