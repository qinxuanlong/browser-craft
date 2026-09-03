import type { Folder, Id, SavedTab, SavedWindow } from "@pagebox/types";

export interface FolderTreeNode {
  folder: Folder;
  tabs: SavedTab[];
  windows: SavedWindow[];
  children: FolderTreeNode[];
  /** 当前节点及子节点包含的标签与窗口总数 */
  totalItemCount: number;
}

export interface FolderTreeData {
  roots: FolderTreeNode[];
  uncategorized: SavedTab[];
  uncategorizedWindows: SavedWindow[];
}

export function buildFolderTree(
  folders: Folder[],
  tabs: SavedTab[],
  windows: SavedWindow[] = [],
): FolderTreeData {
  const sortedFolders = [...folders].sort((a, b) => a.sortOrder - b.sortOrder);
  const tabsByFolder = new Map<Id | null, SavedTab[]>();
  const windowsByFolder = new Map<Id | null, SavedWindow[]>();

  for (const tab of tabs) {
    const key = tab.folderId;
    const list = tabsByFolder.get(key) ?? [];
    list.push(tab);
    tabsByFolder.set(key, list);
  }

  for (const win of windows) {
    const key = win.folderId;
    const list = windowsByFolder.get(key) ?? [];
    list.push(win);
    windowsByFolder.set(key, list);
  }

  const buildNode = (folder: Folder): FolderTreeNode => {
    const directTabs = (tabsByFolder.get(folder.id) ?? []).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    const directWindows = (windowsByFolder.get(folder.id) ?? []).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    const children = sortedFolders
      .filter((child) => child.parentId === folder.id)
      .map(buildNode);

    const totalItemCount =
      directTabs.length +
      directWindows.length +
      children.reduce((acc, c) => acc + c.totalItemCount, 0);

    return {
      folder,
      tabs: directTabs,
      windows: directWindows,
      children,
      totalItemCount,
    };
  };

  const roots = sortedFolders
    .filter((folder) => folder.parentId === null)
    .map(buildNode);

  return {
    roots,
    uncategorized: (tabsByFolder.get(null) ?? []).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    ),
    uncategorizedWindows: (windowsByFolder.get(null) ?? []).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    ),
  };
}

