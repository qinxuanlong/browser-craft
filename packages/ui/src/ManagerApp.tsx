import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pageBoxService, subscribeToBookmarks } from "@pagebox/core";
import type { Folder, Id, SavedTab, SavedWindow } from "@pagebox/types";
import { FolderTree, type FolderTreeRef } from "./FolderTree";
import { TabFavicon } from "./Favicon";
import {
  ChartBarIcon,
  ChevronRight,
  CloseIcon,
  CrownIcon,
  ExternalLinkIcon,
  FolderYellowIcon,
  GlobeIcon,
  GripVerticalIcon,
  MoonIcon,
  PageBoxLogo,
  PlusIcon,
  SettingsIcon,
  SunIcon,
  ThisPcIcon,
  TrashIcon,
  UnfoldLessIcon,
  UnfoldMoreIcon,
  WindowGroupIcon,
} from "./icons";
import { LicenseModal } from "./LicenseModal";
import { useLicense } from "./useLicense";
import { StatisticsDashboard } from "./StatisticsDashboard";
import { SettingsView } from "./SettingsView";
import { I18nProvider, useTranslation } from "./i18n";
import { ThemeProvider, useTheme } from "./ThemeContext";
import "./styles.css";

type NavigationFilter = "all" | "uncategorized" | "windows" | "bookmarks" | "statistics" | "settings" | string; // string is folderId

function ManagerAppInner() {
  const { locale, toggleLocale, t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [windows, setWindows] = useState<SavedWindow[]>([]);
  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState<NavigationFilter>("all");
  const [selectedTabIds, setSelectedTabIds] = useState<Set<Id>>(new Set());
  const [status, setStatus] = useState("");
  const sidebarTreeRef = useRef<FolderTreeRef>(null);

  // 拖拽状态
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);

  // 弹窗状态
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalParentId, setFolderModalParentId] = useState<Id | null>(null);
  const [folderModalName, setFolderModalName] = useState("");

  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const [notesTarget, setNotesTarget] = useState<SavedTab | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const [moveTargetTabId, setMoveTargetTabId] = useState<Id | null>(null);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  const { isPro } = useLicense();

  const refresh = useCallback(async () => {
    const store = await pageBoxService.getStore();
    setFolders(store.folders);
    if (query.trim()) {
      const searchResult = await pageBoxService.search(query);
      setTabs(searchResult.tabs);
      setWindows(searchResult.windows);
    } else {
      setTabs(store.tabs);
      setWindows(store.windows);
    }
  }, [query]);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeToBookmarks(() => {
      void refresh();
    });
    return () => unsubscribe();
  }, [refresh]);

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2500);
  };

  // 当前选中的文件夹对象（如果 activeNav 是 folderId）
  const currentFolder = useMemo(() => {
    if (
      activeNav === "all" ||
      activeNav === "uncategorized" ||
      activeNav === "windows" ||
      activeNav === "bookmarks" ||
      activeNav === "statistics" ||
      activeNav === "settings"
    ) {
      return null;
    }
    return folders.find((f) => f.id === activeNav) ?? null;
  }, [activeNav, folders]);

  // 计算当前重复书签数量
  const duplicateCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const tab of tabs) {
      if (seen.has(tab.url)) {
        count++;
      } else {
        seen.add(tab.url);
      }
    }
    return count;
  }, [tabs]);

  // 根据当前侧边栏导航筛选展示的内容
  const displayedTabs = useMemo(() => {
    if (activeNav === "statistics" || activeNav === "settings") return [];
    let list: SavedTab[] = [];
    if (query.trim()) list = tabs;
    else if (activeNav === "all") list = tabs;
    else if (activeNav === "uncategorized") list = tabs.filter((t) => t.folderId === null);
    else if (activeNav === "windows") list = [];
    else if (activeNav === "bookmarks") list = tabs.filter((t) => Boolean(t.bookmarkId));
    else list = tabs.filter((t) => t.folderId === activeNav);

    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [activeNav, tabs, query]);

  const displayedWindows = useMemo(() => {
    if (activeNav === "statistics" || activeNav === "settings") return [];
    let list: SavedWindow[] = [];
    if (query.trim()) list = windows;
    else if (activeNav === "all" || activeNav === "windows") list = windows;
    else if (activeNav === "uncategorized") list = windows.filter((w) => w.folderId === null);
    else if (activeNav === "bookmarks") list = [];
    else list = windows.filter((w) => w.folderId === activeNav);

    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [activeNav, windows, query]);

  // 面包屑导航计算
  const breadcrumbList = useMemo(() => {
    if (query.trim()) return [{ id: "search", name: t.manager.searchBreadcrumb(query) }];
    if (activeNav === "statistics") return [{ id: "statistics", name: t.sidebar.statistics }];
    if (activeNav === "settings") return [{ id: "settings", name: t.sidebar.settings }];
    if (activeNav === "all") return [{ id: "all", name: t.sidebar.allBookmarks }];
    if (activeNav === "uncategorized") return [{ id: "uncategorized", name: t.sidebar.uncategorized }];
    if (activeNav === "windows") return [{ id: "windows", name: t.sidebar.savedWindows }];
    if (activeNav === "bookmarks") return [{ id: "bookmarks", name: t.manager.browserBookmarks }];

    const path: { id: string; name: string }[] = [];
    let cur: Folder | undefined = currentFolder ?? undefined;
    while (cur) {
      path.unshift({ id: cur.id, name: cur.name });
      cur = cur.parentId ? folders.find((f) => f.id === cur?.parentId) : undefined;
    }
    return path;
  }, [activeNav, currentFolder, folders, query, t]);

  // 快捷操作
  const handleRestoreTab = async (tab: SavedTab) => {
    await pageBoxService.restoreTab(tab.id);
    showStatus(t.manager.openedTab);
  };

  const handleRestoreWindow = async (win: SavedWindow) => {
    await pageBoxService.restoreWindow(win.id);
    showStatus(t.manager.restoredTabs(win.tabs.length));
  };

  const handleDeleteTab = async (tab: SavedTab) => {
    await pageBoxService.deleteTab(tab.id);
    setSelectedTabIds((prev) => {
      const next = new Set(prev);
      next.delete(tab.id);
      return next;
    });
    showStatus(t.manager.deleted);
    await refresh();
  };

  const handleDeleteWindow = async (win: SavedWindow) => {
    await pageBoxService.deleteWindow(win.id);
    showStatus(t.manager.deleted);
    await refresh();
  };

  // 全量打开当前文件夹内标签
  const handleOpenAllInView = async () => {
    if (displayedTabs.length === 0) return;
    for (const tab of displayedTabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
    showStatus(t.manager.openedTabs(displayedTabs.length));
  };

  // 批量全选 / 反选
  const handleToggleSelectAll = () => {
    if (selectedTabIds.size === displayedTabs.length && displayedTabs.length > 0) {
      setSelectedTabIds(new Set());
    } else {
      setSelectedTabIds(new Set(displayedTabs.map((t) => t.id)));
    }
  };

  const handleToggleSelectTab = (tabId: Id) => {
    setSelectedTabIds((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  };

  // 批量打开选中的标签
  const handleBatchOpen = async () => {
    const selected = displayedTabs.filter((t) => selectedTabIds.has(t.id));
    for (const tab of selected) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
    showStatus(t.manager.batchOpenedTabs(selected.length));
  };

  // 批量删除选中的标签
  const handleBatchDelete = async () => {
    if (!confirm(t.manager.batchDeleteConfirm(selectedTabIds.size))) return;
    for (const id of selectedTabIds) {
      await pageBoxService.deleteTab(id);
    }
    setSelectedTabIds(new Set());
    showStatus(t.manager.batchDeleteDone);
    await refresh();
  };

  // 文件夹操作
  const handleOpenCreateFolderModal = (parentId: Id | null = null) => {
    setFolderModalParentId(parentId);
    setFolderModalName("");
    setFolderModalOpen(true);
  };

  const handleCreateFolder = async () => {
    if (!folderModalName.trim()) return;
    const newFolder = await pageBoxService.createFolder(folderModalName.trim(), folderModalParentId);
    setFolderModalOpen(false);
    setActiveNav(newFolder.id);
    showStatus(t.manager.createFolderSuccess(newFolder.name));
    await refresh();
  };

  const handleOpenRename = (folder: Folder) => {
    if (folder.id === "1" || folder.id === "2" || folder.parentId === null) {
      showStatus(t.manager.systemFolderNoRename);
      return;
    }
    setRenameTarget(folder);
    setRenameDraft(folder.name);
  };

  const handleSaveRename = async () => {
    if (!renameTarget || !renameDraft.trim()) return;
    await pageBoxService.renameFolder(renameTarget.id, renameDraft.trim());
    setRenameTarget(null);
    showStatus(t.manager.renameFolderSuccess);
    await refresh();
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (folder.id === "1" || folder.id === "2" || folder.parentId === null) {
      showStatus(t.manager.systemFolderNoDelete);
      return;
    }
    if (confirm(t.manager.deleteFolderKeepContentsConfirm(folder.name))) {
      await pageBoxService.deleteFolder(folder.id, false);
      if (activeNav === folder.id) {
        setActiveNav("all");
      }
      showStatus(t.manager.folderDeleted);
      await refresh();
    }
  };

  // 移动标签到文件夹
  const handleMoveTab = async (targetFolderId: Id | null) => {
    if (!moveTargetTabId) return;
    await pageBoxService.moveTabToFolder(moveTargetTabId, targetFolderId);
    setMoveTargetTabId(null);
    showStatus(t.manager.moveTabSuccess);
    await refresh();
  };

  // 批量移动选中的标签
  const handleBatchMove = async (targetFolderId: Id | null) => {
    await pageBoxService.moveTabsToFolder(Array.from(selectedTabIds), targetFolderId);
    setSelectedTabIds(new Set());
    showStatus(t.manager.batchMoveDone);
    await refresh();
  };

  // 拖拽标签至左侧文件夹
  const handleDropTabsToFolder = async (
    tabIds: string[],
    targetFolderId: string | null,
  ) => {
    try {
      await pageBoxService.moveTabsToFolder(tabIds, targetFolderId);
      showStatus(t.manager.droppedTabsToFolder(tabIds.length));
      await refresh();
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Error");
    }
  };

  // 拖拽调整文件夹（支持 before / after 排序与 inside 嵌套）
  const handleMoveFolder = async (
    sourceFolderId: string,
    targetFolderId: string,
    position: "before" | "after" | "inside",
  ) => {
    try {
      await pageBoxService.moveFolder(sourceFolderId, targetFolderId, position);
      showStatus(position === "inside" ? t.manager.movedFolderInside : t.manager.reorderedFolder);
      await refresh();
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Error");
    }
  };

  // 导出与导入
  const handleExport = async () => {
    const data = await pageBoxService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagebox-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(t.manager.exportJsonSuccess);
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await pageBoxService.importData(data, true);
        showStatus(t.manager.importSuccess(data.tabs?.length ?? 0, data.folders?.length ?? 0));
        await refresh();
      } catch {
        showStatus(t.manager.importFailed);
      }
    };
    input.click();
  };

  /**
   * Pro 特权：一键检测并清理重复的标签页
   */
  const handleCleanDuplicates = async () => {
    if (!isPro) {
      setLicenseModalOpen(true);
      return;
    }

    const seenUrls = new Set<string>();
    const duplicates: SavedTab[] = [];
    for (const tab of tabs) {
      if (seenUrls.has(tab.url)) {
        duplicates.push(tab);
      } else {
        seenUrls.add(tab.url);
      }
    }

    if (duplicates.length === 0) {
      showStatus(t.manager.cleanDuplicatesNoDups);
      return;
    }

    const confirmed = window.confirm(
      t.manager.cleanDuplicatesPrompt(duplicates.length)
    );
    if (!confirmed) return;

    for (const dup of duplicates) {
      await pageBoxService.deleteTab(dup.id);
    }
    showStatus(t.manager.cleanDuplicatesDone(duplicates.length));
    await refresh();
  };

  /**
   * Pro 特权：导出为结构化 Markdown 文档
   */
  const handleExportMarkdown = async () => {
    if (!isPro) {
      setLicenseModalOpen(true);
      return;
    }

    const store = await pageBoxService.getStore();
    let md = `# PageBox ${t.manager.exportMarkdown}\n\n> ${new Date().toLocaleString()}\n\n`;

    if (store.tabs.length > 0) {
      md += `## ${t.tree.tabsCount(store.tabs.length)}\n\n`;
      for (const tab of store.tabs) {
        const noteText = tab.notes ? ` —— *${tab.notes}*` : "";
        md += `- [${tab.title || tab.url}](${tab.url})${noteText}\n`;
      }
      md += "\n";
    }

    if (store.windows.length > 0) {
      md += `## ${t.manager.windowCollection(store.windows.length)}\n\n`;
      for (const win of store.windows) {
        md += `### ${win.name}\n\n`;
        for (const tab of win.tabs) {
          md += `- [${tab.title || tab.url}](${tab.url})\n`;
        }
        md += "\n";
      }
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagebox-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(t.manager.exportMarkdownSuccess);
  };

  const isAllSelected =
    displayedTabs.length > 0 && selectedTabIds.size === displayedTabs.length;

  return (
    <div className="pagebox-manager">
      {/* 顶部主导航栏 */}
      <header className="pagebox-manager__header">
        <div className="pagebox-manager__brand">
          <PageBoxLogo size={26} className="pagebox-manager__logo" />
          <h1 className="pagebox-manager__title">{t.header.managerTitle}</h1>
          {isPro ? (
            <button
              type="button"
              className="pagebox-pro-badge pagebox-pro-badge--active"
              onClick={() => setLicenseModalOpen(true)}
              title={t.header.proActiveTitle}
            >
              <CrownIcon size={12} />
              <span>{t.header.proBadge}</span>
            </button>
          ) : (
            <button
              type="button"
              className="pagebox-pro-badge pagebox-pro-badge--upgrade"
              onClick={() => setLicenseModalOpen(true)}
              title={t.header.upgradeProTitle}
            >
              <CrownIcon size={12} />
              <span>{t.header.upgradePro}</span>
            </button>
          )}
        </div>

        <div className="pagebox-manager__search-box">
          <input
            type="search"
            placeholder={t.search.managerPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="pagebox-manager__top-actions">
          <button
            className="pagebox-btn pagebox-btn--primary"
            onClick={() => handleOpenCreateFolderModal(currentFolder?.id ?? null)}
          >
            <PlusIcon size={14} /> {t.manager.newFolderBtn}
          </button>
          <button
            className={`pagebox-btn ${activeNav === "settings" ? "pagebox-btn--highlight" : ""}`}
            onClick={() => {
              setActiveNav("settings");
              setQuery("");
            }}
            title={t.sidebar.settings}
          >
            <SettingsIcon size={14} /> {t.sidebar.settings}
          </button>
          <button
            type="button"
            className="pagebox-btn pagebox-btn--ghost pagebox-btn--icon"
            onClick={toggleTheme}
            title={resolvedTheme === "dark" ? t.settings.themeLight : t.settings.themeDark}
          >
            {resolvedTheme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>
        </div>
      </header>

      {/* 主体两栏布局：左侧资源管理器树，右侧内容工作区 */}
      <div className="pagebox-manager__layout">
        {/* 左侧 Windows 资源管理器风格导航栏 */}
        <aside className="pagebox-manager__sidebar">
          <div className="pagebox-sidebar__section-header">
            <span>{t.sidebar.thisPc}</span>
          </div>

          <nav className="pagebox-sidebar__nav">
            <button
              className={`pagebox-sidebar__nav-item ${activeNav === "all" ? "is-active" : ""}`}
              onClick={() => setActiveNav("all")}
            >
              <ThisPcIcon size={16} />
              <span className="pagebox-sidebar__nav-label">{t.sidebar.allBookmarks}</span>
              <span className="pagebox-sidebar__nav-badge">{tabs.length}</span>
            </button>

            <button
              className={`pagebox-sidebar__nav-item ${
                activeNav === "statistics" ? "is-active" : ""
              }`}
              onClick={() => {
                setActiveNav("statistics");
                setQuery("");
              }}
            >
              <ChartBarIcon size={16} />
              <span className="pagebox-sidebar__nav-label">{t.sidebar.statistics}</span>
              <span className="pagebox-sidebar__nav-badge">{tabs.length}</span>
            </button>

            <button
              className={`pagebox-sidebar__nav-item ${
                activeNav === "uncategorized" ? "is-active" : ""
              }`}
              onClick={() => setActiveNav("uncategorized")}
            >
              <span className="pagebox-tree-icon">📁</span>
              <span className="pagebox-sidebar__nav-label">{t.sidebar.uncategorized}</span>
              <span className="pagebox-sidebar__nav-badge">
                {tabs.filter((t) => t.folderId === null).length}
              </span>
            </button>

            <button
              className={`pagebox-sidebar__nav-item ${activeNav === "windows" ? "is-active" : ""}`}
              onClick={() => setActiveNav("windows")}
            >
              <WindowGroupIcon size={16} />
              <span className="pagebox-sidebar__nav-label">{t.sidebar.savedWindows}</span>
              <span className="pagebox-sidebar__nav-badge">{windows.length}</span>
            </button>

            <button
              className={`pagebox-sidebar__nav-item ${activeNav === "settings" ? "is-active" : ""}`}
              onClick={() => {
                setActiveNav("settings");
                setQuery("");
              }}
            >
              <SettingsIcon size={16} />
              <span className="pagebox-sidebar__nav-label">{t.sidebar.settings}</span>
            </button>
          </nav>

          <div className="pagebox-sidebar__section-header">
            <span>{t.sidebar.folderTree}</span>
            <div className="pagebox-sidebar__header-actions">
              <button
                type="button"
                className="pagebox-sidebar__add-btn"
                onClick={() => sidebarTreeRef.current?.expandAll()}
                title={t.sidebar.expandAll}
                aria-label={t.sidebar.expandAll}
              >
                <UnfoldMoreIcon size={13} />
              </button>
              <button
                type="button"
                className="pagebox-sidebar__add-btn"
                onClick={() => sidebarTreeRef.current?.collapseAll()}
                title={t.sidebar.collapseAll}
                aria-label={t.sidebar.collapseAll}
              >
                <UnfoldLessIcon size={13} />
              </button>
              <button
                type="button"
                className="pagebox-sidebar__add-btn"
                onClick={() => handleOpenCreateFolderModal(null)}
                title={t.sidebar.newRootFolder}
                aria-label={t.sidebar.newRootFolder}
              >
                <PlusIcon size={12} />
              </button>
            </div>
          </div>

          <div className="pagebox-sidebar__tree-container">
            <FolderTree
              ref={sidebarTreeRef}
              folders={folders}
              tabs={tabs}
              windows={windows}
              mode="sidebar"
              selectedId={
                activeNav === "all" ||
                activeNav === "uncategorized" ||
                activeNav === "windows" ||
                activeNav === "bookmarks" ||
                activeNav === "statistics" ||
                activeNav === "settings"
                  ? null
                  : activeNav
              }
              onSelectFolder={(folderId) => setActiveNav(folderId ?? "uncategorized")}
              onCreateFolder={(parentId) => handleOpenCreateFolderModal(parentId)}
              onRenameFolder={handleOpenRename}
              onDeleteFolder={handleDeleteFolder}
              onDropTabsToFolder={handleDropTabsToFolder}
              onMoveFolder={handleMoveFolder}
            />
          </div>
        </aside>

        {/* 右侧主内容展示与操作区 */}
        <main className="pagebox-manager__content">
          {/* 面包屑与路径工具栏 */}
          <div className="pagebox-content__breadcrumb-bar">
            <div className="pagebox-breadcrumbs">
              <span className="pagebox-breadcrumbs__root">{t.manager.thisPc}</span>
              {breadcrumbList.map((item) => (
                <span key={item.id} className="pagebox-breadcrumbs__crumb">
                  <ChevronRight size={10} />
                  <span>{item.name}</span>
                </span>
              ))}
            </div>

            <div className="pagebox-content__folder-actions">
              {displayedTabs.length > 0 && (
                <button
                  className="pagebox-btn pagebox-btn--sm"
                  onClick={handleOpenAllInView}
                  title={t.manager.openAllInViewTitle}
                >
                  <ExternalLinkIcon size={13} /> {t.manager.openAllInView(displayedTabs.length)}
                </button>
              )}
              {currentFolder && (
                <>
                  <button
                    className="pagebox-btn pagebox-btn--sm"
                    onClick={() => handleOpenCreateFolderModal(currentFolder.id)}
                  >
                    <PlusIcon size={12} /> {t.manager.subfolder}
                  </button>
                  {currentFolder.id !== "1" &&
                    currentFolder.id !== "2" &&
                    currentFolder.parentId !== null && (
                      <>
                        <button
                          className="pagebox-btn pagebox-btn--sm"
                          onClick={() => handleOpenRename(currentFolder)}
                        >
                          {t.manager.rename}
                        </button>
                        <button
                          className="pagebox-btn pagebox-btn--sm pagebox-btn--danger"
                          onClick={() => handleDeleteFolder(currentFolder)}
                        >
                          <TrashIcon size={12} /> {t.manager.delete}
                        </button>
                      </>
                    )}
                </>
              )}
            </div>
          </div>

          {activeNav === "statistics" ? (
            <StatisticsDashboard
              tabs={tabs}
              folders={folders}
              onRefresh={refresh}
              onNavigateFolder={(folderId) => setActiveNav(folderId)}
              onSearchFilter={(term) => {
                setActiveNav("all");
                setQuery(term);
              }}
              showStatus={showStatus}
            />
          ) : activeNav === "settings" ? (
            <SettingsView
              onCleanDuplicates={handleCleanDuplicates}
              onExportMarkdown={handleExportMarkdown}
              onExportJson={handleExport}
              onImportJson={handleImport}
              duplicateCount={duplicateCount}
              totalTabsCount={tabs.length}
              isPro={isPro}
              onOpenLicenseModal={() => setLicenseModalOpen(true)}
            />
          ) : (
            <>
              {/* 批量操作控制条 */}
              {displayedTabs.length > 0 && (
            <div className="pagebox-batch-bar">
              <label className="pagebox-batch-bar__select-all">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                />
                <span>{t.manager.selectAll(displayedTabs.length)}</span>
              </label>

              {selectedTabIds.size > 0 && (
                <div className="pagebox-batch-bar__actions">
                  <span className="pagebox-batch-bar__count">
                    {t.manager.selectedCount(selectedTabIds.size)}
                  </span>
                  <button
                    className="pagebox-btn pagebox-btn--sm"
                    onClick={handleBatchOpen}
                  >
                    {t.manager.openSelected}
                  </button>
                  <div className="pagebox-batch-bar__move">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        void handleBatchMove(val === "null" ? null : val);
                        e.target.value = "";
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {t.manager.batchMoveTo}
                      </option>
                      <option value="null">{t.manager.moveToUncategorized}</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          📁 {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="pagebox-btn pagebox-btn--sm pagebox-btn--danger"
                    onClick={handleBatchDelete}
                  >
                    {t.manager.batchDelete}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 内容列表区 */}
          <div className="pagebox-content__list-container">
            {displayedTabs.length === 0 && displayedWindows.length === 0 ? (
              <div className="pagebox-manager__empty">
                <FolderYellowIcon size={48} />
                <p className="pagebox-empty__title">{t.manager.emptyFolderTitle}</p>
                <p className="pagebox-empty__subtitle">
                  {t.manager.emptyFolderDesc}
                </p>
              </div>
            ) : (
              <>
                {/* 窗口卡片列表 */}
                {displayedWindows.length > 0 && (
                  <section className="pagebox-list-section">
                    <h2 className="pagebox-list-section__title">
                      {t.manager.windowCollection(displayedWindows.length)}
                    </h2>
                    <div className="pagebox-cards-grid">
                      {displayedWindows.map((win) => (
                        <div key={win.id} className="pagebox-window-card">
                          <div className="pagebox-window-card__header">
                            <WindowGroupIcon size={18} />
                            <span className="pagebox-window-card__title">{win.name}</span>
                            <span className="pagebox-window-card__count">
                              {t.manager.tabsCount(win.tabs.length)}
                            </span>
                          </div>
                          <div className="pagebox-window-card__tabs">
                            {win.tabs.slice(0, 4).map((t, i) => (
                              <div key={i} className="pagebox-window-card__tab-preview">
                                <TabFavicon
                                  url={t.url}
                                  favIconUrl={t.favIconUrl}
                                  className="preview-icon"
                                  size={14}
                                />
                                <span>{t.title}</span>
                              </div>
                            ))}
                            {win.tabs.length > 4 && (
                              <div className="pagebox-window-card__more">
                                {t.manager.moreTabs(win.tabs.length - 4)}
                              </div>
                            )}
                          </div>
                          <div className="pagebox-window-card__actions">
                            <button
                              className="pagebox-btn pagebox-btn--sm pagebox-btn--primary"
                              onClick={() => handleRestoreWindow(win)}
                            >
                              {t.manager.restoreWindow}
                            </button>
                            <button
                              className="pagebox-btn pagebox-btn--sm"
                              onClick={() => handleDeleteWindow(win)}
                            >
                              {t.manager.delete}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 标签列表 */}
                {displayedTabs.length > 0 && (
                  <section className="pagebox-list-section">
                    <h2 className="pagebox-list-section__title">
                      {t.manager.tabSectionTitle(displayedTabs.length)}
                    </h2>
                    <div className="pagebox-table-list">
                      {displayedTabs.map((tab) => {
                        const isSelected = selectedTabIds.has(tab.id);
                        const tabFolder = folders.find((f) => f.id === tab.folderId);

                        const isDragging = draggingTabId === tab.id;
                        const dropPosition =
                          dragOverTarget?.id === tab.id ? dragOverTarget.position : null;

                        return (
                          <div
                            key={tab.id}
                            className={`pagebox-tab-row ${isSelected ? "is-selected" : ""} ${
                              isDragging ? "is-dragging" : ""
                            } ${dropPosition ? `is-drop-${dropPosition}` : ""}`}
                            draggable
                            onDragStart={(e) => {
                              setDraggingTabId(tab.id);
                              const idsToDrag =
                                selectedTabIds.has(tab.id) && selectedTabIds.size > 1
                                  ? Array.from(selectedTabIds)
                                  : [tab.id];
                              e.dataTransfer.setData(
                                "application/pagebox-tab",
                                JSON.stringify(idsToDrag),
                              );
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              setDraggingTabId(null);
                              setDragOverTarget(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!draggingTabId || draggingTabId === tab.id) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const midY = rect.top + rect.height / 2;
                              const pos = e.clientY < midY ? "before" : "after";
                              setDragOverTarget({ id: tab.id, position: pos });
                            }}
                            onDragLeave={() => {
                              if (dragOverTarget?.id === tab.id) {
                                setDragOverTarget(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!draggingTabId || draggingTabId === tab.id) return;

                              const position = dragOverTarget?.position ?? "after";
                              const fromId = draggingTabId;
                              const toId = tab.id;

                              const fromIndex = displayedTabs.findIndex((t) => t.id === fromId);
                              if (fromIndex === -1) return;
                              const item = displayedTabs[fromIndex];
                              const without = displayedTabs.filter((t) => t.id !== fromId);
                              const targetIndex = without.findIndex((t) => t.id === toId);
                              if (targetIndex === -1) return;

                              const insertIndex =
                                position === "before" ? targetIndex : targetIndex + 1;
                              const updated = [...without];
                              updated.splice(insertIndex, 0, item);

                              setTabs((prev) => {
                                const idMap = new Map(updated.map((t, idx) => [t.id, idx]));
                                return prev.map((t) =>
                                  idMap.has(t.id)
                                    ? { ...t, sortOrder: idMap.get(t.id)! }
                                    : t,
                                );
                              });

                              setDragOverTarget(null);
                              setDraggingTabId(null);

                              void pageBoxService
                                .reorderTabs(updated.map((t) => t.id))
                                .then(() => {
                                  showStatus(t.manager.orderUpdated);
                                });
                            }}
                          >
                            <div
                              className="pagebox-tab-row__drag-handle"
                              title={t.manager.dragHandleTitle}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVerticalIcon size={14} />
                            </div>

                            <div className="pagebox-tab-row__checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectTab(tab.id)}
                              />
                            </div>

                            <div
                              className="pagebox-tab-row__main"
                              onClick={() => handleRestoreTab(tab)}
                            >
                              <TabFavicon
                                url={tab.url}
                                favIconUrl={tab.favIconUrl}
                                className="pagebox-tab-row__icon"
                                size={16}
                              />
                              <div className="pagebox-tab-row__info">
                                <div className="pagebox-tab-row__title" title={tab.title}>
                                  {tab.title}
                                </div>
                                <div className="pagebox-tab-row__url" title={tab.url}>
                                  {tab.url}
                                </div>
                                {tab.notes && (
                                  <div className="pagebox-tab-row__notes">📝 {tab.notes}</div>
                                )}
                              </div>
                            </div>

                            <div className="pagebox-tab-row__folder-tag">
                              {tabFolder ? (
                                <span
                                  className="folder-badge"
                                  onClick={() => setActiveNav(tabFolder.id)}
                                >
                                  📁 {tabFolder.name}
                                </span>
                              ) : (
                                <span className="folder-badge folder-badge--none">{t.manager.uncategorizedBadge}</span>
                              )}
                            </div>

                            <div className="pagebox-tab-row__actions">
                              <button
                                className="pagebox-action-btn"
                                onClick={() => handleRestoreTab(tab)}
                                title={t.manager.openInNewTab}
                              >
                                {t.manager.open}
                              </button>
                              <button
                                className="pagebox-action-btn"
                                onClick={() => {
                                  setNotesTarget(tab);
                                  setNotesDraft(tab.notes ?? "");
                                }}
                                title={t.manager.editNotes}
                              >
                                {t.manager.notes}
                              </button>
                              <button
                                className="pagebox-action-btn"
                                onClick={() => setMoveTargetTabId(tab.id)}
                                title={t.manager.moveToFolder}
                              >
                                {t.manager.move}
                              </button>
                              <button
                                className="pagebox-action-btn pagebox-action-btn--danger"
                                onClick={() => handleDeleteTab(tab)}
                                title={t.manager.delete}
                              >
                                {t.manager.delete}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
            </>
          )}
        </main>
      </div>

      {/* 底部浮动状态栏 */}
      {status && <div className="pagebox-manager__status-toast">{status}</div>}

      {/* 新建文件夹弹窗 */}
      {folderModalOpen && (
        <div className="pagebox-modal-backdrop" onClick={() => setFolderModalOpen(false)}>
          <div className="pagebox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pagebox-modal-header">
              <h2>{t.manager.createFolderTitle}</h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setFolderModalOpen(false)}
                title={t.license.close}
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <div className="pagebox-modal__tip">
              <span className="pagebox-modal__tip-label">{t.manager.parentLocation}</span>
              <span className="pagebox-modal__tip-badge">
                <FolderYellowIcon size={14} />
                {folderModalParentId
                  ? folders.find((f) => f.id === folderModalParentId)?.name ?? t.manager.rootFolder
                  : t.manager.rootFolder}
              </span>
            </div>
            <input
              type="text"
              autoFocus
              value={folderModalName}
              onChange={(e) => setFolderModalName(e.target.value)}
              placeholder={t.manager.folderNamePlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreateFolder();
                if (e.key === "Escape") setFolderModalOpen(false);
              }}
            />
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setFolderModalOpen(false)}>
                {t.manager.cancelBtn}
              </button>
              <button
                className="pagebox-btn pagebox-btn--primary"
                onClick={handleCreateFolder}
                disabled={!folderModalName.trim()}
              >
                {t.manager.createBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名文件夹弹窗 */}
      {renameTarget && (
        <div className="pagebox-modal-backdrop" onClick={() => setRenameTarget(null)}>
          <div className="pagebox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pagebox-modal-header">
              <h2>{t.manager.renameFolderTitle}</h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setRenameTarget(null)}
                title={t.license.close}
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              placeholder={t.manager.renameFolderPlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveRename();
                if (e.key === "Escape") setRenameTarget(null);
              }}
            />
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setRenameTarget(null)}>
                {t.manager.cancelBtn}
              </button>
              <button
                className="pagebox-btn pagebox-btn--primary"
                onClick={handleSaveRename}
                disabled={!renameDraft.trim()}
              >
                {t.manager.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移动单标签至文件夹弹窗 */}
      {moveTargetTabId && (
        <div className="pagebox-modal-backdrop" onClick={() => setMoveTargetTabId(null)}>
          <div className="pagebox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pagebox-modal-header">
              <h2>{t.manager.moveTabModalTitle}</h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setMoveTargetTabId(null)}
                title={t.license.close}
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <div className="pagebox-modal__tip">
              <span className="pagebox-modal__tip-label">{t.manager.selectTargetFolder}</span>
            </div>
            <div className="pagebox-folder-select-list">
              <button
                type="button"
                className="pagebox-folder-select-item"
                onClick={() => handleMoveTab(null)}
              >
                <FolderYellowIcon size={15} /> {t.manager.uncategorizedRemoveFromFolder}
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="pagebox-folder-select-item"
                  onClick={() => handleMoveTab(f.id)}
                >
                  <FolderYellowIcon size={15} /> {f.name}
                </button>
              ))}
            </div>
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setMoveTargetTabId(null)}>
                {t.manager.cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑备注弹窗 */}
      {notesTarget && (
        <div className="pagebox-modal-backdrop" onClick={() => setNotesTarget(null)}>
          <div className="pagebox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pagebox-modal-header">
              <h2>{t.manager.editNotesTitle}</h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setNotesTarget(null)}
                title={t.license.close}
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <textarea
              autoFocus
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder={t.manager.addNotesPlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void (async () => {
                    await pageBoxService.updateTabNotes(notesTarget.id, notesDraft);
                    setNotesTarget(null);
                    showStatus(t.manager.notesSaved);
                    await refresh();
                  })();
                }
                if (e.key === "Escape") setNotesTarget(null);
              }}
            />
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setNotesTarget(null)}>
                {t.manager.cancelBtn}
              </button>
              <button
                className="pagebox-btn pagebox-btn--primary"
                onClick={async () => {
                  await pageBoxService.updateTabNotes(notesTarget.id, notesDraft);
                  setNotesTarget(null);
                  showStatus(t.manager.notesSaved);
                  await refresh();
                }}
              >
                {t.manager.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <LicenseModal
        isOpen={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
      />
    </div>
  );
}

export function ManagerApp() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ManagerAppInner />
      </I18nProvider>
    </ThemeProvider>
  );
}

