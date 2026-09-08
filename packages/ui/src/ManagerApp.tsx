import { useCallback, useEffect, useMemo, useState } from "react";
import { pageBoxService, subscribeToBookmarks } from "@pagebox/core";
import type { Folder, Id, SavedTab, SavedWindow } from "@pagebox/types";
import { FolderTree } from "./FolderTree";
import { TabFavicon } from "./Favicon";
import {
  ChartBarIcon,
  ChevronRight,
  CloseIcon,
  CrownIcon,
  ExternalLinkIcon,
  FolderYellowIcon,
  GripVerticalIcon,
  PageBoxLogo,
  PlusIcon,
  ThisPcIcon,
  TrashIcon,
  WindowGroupIcon,
} from "./icons";
import { LicenseModal } from "./LicenseModal";
import { useLicense } from "./useLicense";
import { StatisticsDashboard } from "./StatisticsDashboard";
import "./styles.css";

type NavigationFilter = "all" | "uncategorized" | "windows" | "bookmarks" | "statistics" | string; // string is folderId

export function ManagerApp() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [windows, setWindows] = useState<SavedWindow[]>([]);
  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState<NavigationFilter>("all");
  const [selectedTabIds, setSelectedTabIds] = useState<Set<Id>>(new Set());
  const [status, setStatus] = useState("");

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
      activeNav === "statistics"
    ) {
      return null;
    }
    return folders.find((f) => f.id === activeNav) ?? null;
  }, [activeNav, folders]);

  // 根据当前侧边栏导航筛选展示的内容
  const displayedTabs = useMemo(() => {
    if (activeNav === "statistics") return [];
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
    if (activeNav === "statistics") return [];
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
    if (query.trim()) return [{ id: "search", name: `搜索: "${query}"` }];
    if (activeNav === "statistics") return [{ id: "statistics", name: "统计看板" }];
    if (activeNav === "all") return [{ id: "all", name: "全部收藏" }];
    if (activeNav === "uncategorized") return [{ id: "uncategorized", name: "未分类" }];
    if (activeNav === "windows") return [{ id: "windows", name: "已收藏窗口" }];
    if (activeNav === "bookmarks") return [{ id: "bookmarks", name: "浏览器书签" }];

    const path: { id: string; name: string }[] = [];
    let cur: Folder | undefined = currentFolder ?? undefined;
    while (cur) {
      path.unshift({ id: cur.id, name: cur.name });
      cur = cur.parentId ? folders.find((f) => f.id === cur?.parentId) : undefined;
    }
    return path;
  }, [activeNav, currentFolder, folders, query]);

  // 快捷操作
  const handleRestoreTab = async (tab: SavedTab) => {
    await pageBoxService.restoreTab(tab.id);
    showStatus("已打开标签页");
  };

  const handleRestoreWindow = async (win: SavedWindow) => {
    await pageBoxService.restoreWindow(win.id);
    showStatus(`已恢复 ${win.tabs.length} 个标签页`);
  };

  const handleDeleteTab = async (tab: SavedTab) => {
    await pageBoxService.deleteTab(tab.id);
    setSelectedTabIds((prev) => {
      const next = new Set(prev);
      next.delete(tab.id);
      return next;
    });
    showStatus("已删除");
    await refresh();
  };

  const handleDeleteWindow = async (win: SavedWindow) => {
    await pageBoxService.deleteWindow(win.id);
    showStatus("已删除");
    await refresh();
  };

  // 全量打开当前文件夹内标签
  const handleOpenAllInView = async () => {
    if (displayedTabs.length === 0) return;
    for (const tab of displayedTabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
    showStatus(`已打开 ${displayedTabs.length} 个标签页`);
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
    showStatus(`已打开选中的 ${selected.length} 个标签页`);
  };

  // 批量删除选中的标签
  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedTabIds.size} 个标签吗？`)) return;
    for (const id of selectedTabIds) {
      await pageBoxService.deleteTab(id);
    }
    setSelectedTabIds(new Set());
    showStatus("批量删除完成");
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
    showStatus(`文件夹 "${newFolder.name}" 创建成功`);
    await refresh();
  };

  const handleOpenRename = (folder: Folder) => {
    if (folder.id === "1" || folder.id === "2" || folder.parentId === null) {
      showStatus("浏览器系统根文件夹不可重命名");
      return;
    }
    setRenameTarget(folder);
    setRenameDraft(folder.name);
  };

  const handleSaveRename = async () => {
    if (!renameTarget || !renameDraft.trim()) return;
    await pageBoxService.renameFolder(renameTarget.id, renameDraft.trim());
    setRenameTarget(null);
    showStatus("重命名成功");
    await refresh();
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (folder.id === "1" || folder.id === "2" || folder.parentId === null) {
      showStatus("浏览器系统根文件夹不可删除");
      return;
    }
    if (confirm(`确定要删除文件夹 "${folder.name}" 吗？（内部标签将被保留并移至上一级目录）`)) {
      await pageBoxService.deleteFolder(folder.id, false);
      if (activeNav === folder.id) {
        setActiveNav("all");
      }
      showStatus("文件夹已删除");
      await refresh();
    }
  };

  // 移动标签到文件夹
  const handleMoveTab = async (targetFolderId: Id | null) => {
    if (!moveTargetTabId) return;
    await pageBoxService.moveTabToFolder(moveTargetTabId, targetFolderId);
    setMoveTargetTabId(null);
    showStatus("标签移动成功");
    await refresh();
  };

  // 批量移动选中的标签
  const handleBatchMove = async (targetFolderId: Id | null) => {
    await pageBoxService.moveTabsToFolder(Array.from(selectedTabIds), targetFolderId);
    setSelectedTabIds(new Set());
    showStatus("批量移动完成");
    await refresh();
  };

  // 拖拽标签至左侧文件夹
  const handleDropTabsToFolder = async (
    tabIds: string[],
    targetFolderId: string | null,
  ) => {
    try {
      await pageBoxService.moveTabsToFolder(tabIds, targetFolderId);
      showStatus(`已移动 ${tabIds.length} 个标签到目标文件夹`);
      await refresh();
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "移动失败");
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
      showStatus(position === "inside" ? "已移入文件夹" : "已更新文件夹排序");
      await refresh();
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "调整文件夹失败");
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
    showStatus("导出成功");
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
        showStatus("导入成功");
        await refresh();
      } catch {
        showStatus("导入失败，请检查文件格式");
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
      showStatus("未检测到重复标签页，收藏库非常整洁！");
      return;
    }

    const confirmed = window.confirm(
      `检测到 ${duplicates.length} 个重复的网页标签，是否一键清理重复项并保留首个？`
    );
    if (!confirmed) return;

    for (const dup of duplicates) {
      await pageBoxService.deleteTab(dup.id);
    }
    showStatus(`已智能清理 ${duplicates.length} 个重复网页`);
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
    let md = `# PageBox 标签页收藏清单\n\n> 导出时间：${new Date().toLocaleString()}\n\n`;

    if (store.tabs.length > 0) {
      md += `## 标签列表 (${store.tabs.length})\n\n`;
      for (const tab of store.tabs) {
        const noteText = tab.notes ? ` —— *${tab.notes}*` : "";
        md += `- [${tab.title || tab.url}](${tab.url})${noteText}\n`;
      }
      md += "\n";
    }

    if (store.windows.length > 0) {
      md += `## 窗口集合 (${store.windows.length})\n\n`;
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
    showStatus("Markdown 文档已成功导出");
  };

  const isAllSelected =
    displayedTabs.length > 0 && selectedTabIds.size === displayedTabs.length;

  return (
    <div className="pagebox-manager">
      {/* 顶部主导航栏 */}
      <header className="pagebox-manager__header">
        <div className="pagebox-manager__brand">
          <PageBoxLogo size={26} className="pagebox-manager__logo" />
          <h1 className="pagebox-manager__title">PageBox 标签管理中心</h1>
          {isPro ? (
            <button
              type="button"
              className="pagebox-pro-badge pagebox-pro-badge--active"
              onClick={() => setLicenseModalOpen(true)}
              title="Pro 尊享特权生效中，点击查看授权详情"
            >
              <CrownIcon size={12} />
              <span>PRO</span>
            </button>
          ) : (
            <button
              type="button"
              className="pagebox-pro-badge pagebox-pro-badge--upgrade"
              onClick={() => setLicenseModalOpen(true)}
              title="升级 Pro 解锁高级特权"
            >
              <CrownIcon size={12} />
              <span>升级 Pro</span>
            </button>
          )}
        </div>

        <div className="pagebox-manager__search-box">
          <input
            type="search"
            placeholder="全文检索（标题、URL、备注、标签）…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="pagebox-manager__top-actions">
          <button
            className={`pagebox-btn ${activeNav === "statistics" ? "pagebox-btn--highlight" : ""}`}
            onClick={() => {
              setActiveNav("statistics");
              setQuery("");
            }}
            title="书签全维数据统计与健康治理看板"
          >
            <ChartBarIcon size={14} /> 统计看板
          </button>
          <button
            className="pagebox-btn pagebox-btn--primary"
            onClick={() => handleOpenCreateFolderModal(currentFolder?.id ?? null)}
          >
            <PlusIcon size={14} /> 新建文件夹
          </button>
          <button
            className="pagebox-btn"
            onClick={handleCleanDuplicates}
            title="一键智能清理重复网页"
          >
            清理重复
          </button>
          <button
            className="pagebox-btn"
            onClick={handleExportMarkdown}
            title="导出为 Markdown 结构化文档"
          >
            导出 Markdown
          </button>
          <button className="pagebox-btn" onClick={handleExport}>
            导出 JSON
          </button>
          <button className="pagebox-btn" onClick={handleImport}>
            导入 JSON
          </button>
        </div>
      </header>

      {/* 主体两栏布局：左侧资源管理器树，右侧内容工作区 */}
      <div className="pagebox-manager__layout">
        {/* 左侧 Windows 资源管理器风格导航栏 */}
        <aside className="pagebox-manager__sidebar">
          <div className="pagebox-sidebar__section-header">
            <span>此电脑 / 快捷导航</span>
          </div>

          <nav className="pagebox-sidebar__nav">
            <button
              className={`pagebox-sidebar__nav-item ${activeNav === "all" ? "is-active" : ""}`}
              onClick={() => setActiveNav("all")}
            >
              <ThisPcIcon size={16} />
              <span className="pagebox-sidebar__nav-label">全部收藏</span>
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
              <span className="pagebox-sidebar__nav-label">统计看板</span>
              <span className="pagebox-sidebar__nav-badge">{tabs.length}</span>
            </button>

            <button
              className={`pagebox-sidebar__nav-item ${
                activeNav === "uncategorized" ? "is-active" : ""
              }`}
              onClick={() => setActiveNav("uncategorized")}
            >
              <span className="pagebox-tree-icon">📁</span>
              <span className="pagebox-sidebar__nav-label">未分类标签</span>
              <span className="pagebox-sidebar__nav-badge">
                {tabs.filter((t) => t.folderId === null).length}
              </span>
            </button>

            <button
              className={`pagebox-sidebar__nav-item ${activeNav === "windows" ? "is-active" : ""}`}
              onClick={() => setActiveNav("windows")}
            >
              <WindowGroupIcon size={16} />
              <span className="pagebox-sidebar__nav-label">已收藏窗口</span>
              <span className="pagebox-sidebar__nav-badge">{windows.length}</span>
            </button>
          </nav>

          <div className="pagebox-sidebar__section-header">
            <span>文件夹树 (Windows 目录展开)</span>
            <button
              className="pagebox-sidebar__add-btn"
              onClick={() => handleOpenCreateFolderModal(null)}
              title="新建根文件夹"
            >
              <PlusIcon size={12} />
            </button>
          </div>

          <div className="pagebox-sidebar__tree-container">
            <FolderTree
              folders={folders}
              tabs={tabs}
              windows={windows}
              mode="sidebar"
              selectedId={
                activeNav === "all" ||
                activeNav === "uncategorized" ||
                activeNav === "windows" ||
                activeNav === "bookmarks"
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
              <span className="pagebox-breadcrumbs__root">此电脑</span>
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
                  title="全部在新标签页中打开"
                >
                  <ExternalLinkIcon size={13} /> 全部打开 ({displayedTabs.length})
                </button>
              )}
              {currentFolder && (
                <>
                  <button
                    className="pagebox-btn pagebox-btn--sm"
                    onClick={() => handleOpenCreateFolderModal(currentFolder.id)}
                  >
                    <PlusIcon size={12} /> 子文件夹
                  </button>
                  {currentFolder.id !== "1" &&
                    currentFolder.id !== "2" &&
                    currentFolder.parentId !== null && (
                      <>
                        <button
                          className="pagebox-btn pagebox-btn--sm"
                          onClick={() => handleOpenRename(currentFolder)}
                        >
                          重命名
                        </button>
                        <button
                          className="pagebox-btn pagebox-btn--sm pagebox-btn--danger"
                          onClick={() => handleDeleteFolder(currentFolder)}
                        >
                          <TrashIcon size={12} /> 删除
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
                <span>全选当前视图 ({displayedTabs.length})</span>
              </label>

              {selectedTabIds.size > 0 && (
                <div className="pagebox-batch-bar__actions">
                  <span className="pagebox-batch-bar__count">
                    已勾选 {selectedTabIds.size} 项
                  </span>
                  <button
                    className="pagebox-btn pagebox-btn--sm"
                    onClick={handleBatchOpen}
                  >
                    打开勾选项
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
                        批量移动至…
                      </option>
                      <option value="null">移至「未分类」</option>
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
                    批量删除
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
                <p className="pagebox-empty__title">此文件夹下暂无内容</p>
                <p className="pagebox-empty__subtitle">
                  切换到其他目录浏览，或在上方点击「新建文件夹」与「同步书签」
                </p>
              </div>
            ) : (
              <>
                {/* 窗口卡片列表 */}
                {displayedWindows.length > 0 && (
                  <section className="pagebox-list-section">
                    <h2 className="pagebox-list-section__title">
                      窗口集合 ({displayedWindows.length})
                    </h2>
                    <div className="pagebox-cards-grid">
                      {displayedWindows.map((win) => (
                        <div key={win.id} className="pagebox-window-card">
                          <div className="pagebox-window-card__header">
                            <WindowGroupIcon size={18} />
                            <span className="pagebox-window-card__title">{win.name}</span>
                            <span className="pagebox-window-card__count">
                              {win.tabs.length} 标签
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
                                + 还有 {win.tabs.length - 4} 个…
                              </div>
                            )}
                          </div>
                          <div className="pagebox-window-card__actions">
                            <button
                              className="pagebox-btn pagebox-btn--sm pagebox-btn--primary"
                              onClick={() => handleRestoreWindow(win)}
                            >
                              恢复窗口
                            </button>
                            <button
                              className="pagebox-btn pagebox-btn--sm"
                              onClick={() => handleDeleteWindow(win)}
                            >
                              删除
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
                      标签页 ({displayedTabs.length})
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
                                  showStatus("已更新排序");
                                });
                            }}
                          >
                            <div
                              className="pagebox-tab-row__drag-handle"
                              title="拖拽调整排序或拖动至左侧文件夹"
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
                                <span className="folder-badge folder-badge--none">未分类</span>
                              )}
                            </div>

                            <div className="pagebox-tab-row__actions">
                              <button
                                className="pagebox-action-btn"
                                onClick={() => handleRestoreTab(tab)}
                                title="在新标签页打开"
                              >
                                打开
                              </button>
                              <button
                                className="pagebox-action-btn"
                                onClick={() => {
                                  setNotesTarget(tab);
                                  setNotesDraft(tab.notes ?? "");
                                }}
                                title="编辑备注"
                              >
                                备注
                              </button>
                              <button
                                className="pagebox-action-btn"
                                onClick={() => setMoveTargetTabId(tab.id)}
                                title="移动到文件夹"
                              >
                                移动
                              </button>
                              <button
                                className="pagebox-action-btn pagebox-action-btn--danger"
                                onClick={() => handleDeleteTab(tab)}
                                title="删除"
                              >
                                删除
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
              <h2>新建文件夹</h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setFolderModalOpen(false)}
                title="关闭"
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <div className="pagebox-modal__tip">
              <span className="pagebox-modal__tip-label">父级位置:</span>
              <span className="pagebox-modal__tip-badge">
                <FolderYellowIcon size={14} />
                {folderModalParentId
                  ? folders.find((f) => f.id === folderModalParentId)?.name ?? "根目录"
                  : "根目录"}
              </span>
            </div>
            <input
              type="text"
              autoFocus
              value={folderModalName}
              onChange={(e) => setFolderModalName(e.target.value)}
              placeholder="请输入文件夹名称…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreateFolder();
                if (e.key === "Escape") setFolderModalOpen(false);
              }}
            />
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setFolderModalOpen(false)}>
                取消
              </button>
              <button
                className="pagebox-btn pagebox-btn--primary"
                onClick={handleCreateFolder}
                disabled={!folderModalName.trim()}
              >
                创建
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
              <h2>重命名文件夹</h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setRenameTarget(null)}
                title="关闭"
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              placeholder="请输入新的文件夹名称"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveRename();
                if (e.key === "Escape") setRenameTarget(null);
              }}
            />
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setRenameTarget(null)}>
                取消
              </button>
              <button
                className="pagebox-btn pagebox-btn--primary"
                onClick={handleSaveRename}
                disabled={!renameDraft.trim()}
              >
                保存
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
              <h2>移动标签至文件夹</h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setMoveTargetTabId(null)}
                title="关闭"
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <div className="pagebox-modal__tip">
              <span className="pagebox-modal__tip-label">请选择目标文件夹：</span>
            </div>
            <div className="pagebox-folder-select-list">
              <button
                type="button"
                className="pagebox-folder-select-item"
                onClick={() => handleMoveTab(null)}
              >
                <FolderYellowIcon size={15} /> 未分类（移出文件夹）
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
                取消
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
              <h2>编辑备注</h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setNotesTarget(null)}
                title="关闭"
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <textarea
              autoFocus
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="添加备注…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void (async () => {
                    await pageBoxService.updateTabNotes(notesTarget.id, notesDraft);
                    setNotesTarget(null);
                    showStatus("备注已保存");
                    await refresh();
                  })();
                }
                if (e.key === "Escape") setNotesTarget(null);
              }}
            />
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setNotesTarget(null)}>
                取消
              </button>
              <button
                className="pagebox-btn pagebox-btn--primary"
                onClick={async () => {
                  await pageBoxService.updateTabNotes(notesTarget.id, notesDraft);
                  setNotesTarget(null);
                  showStatus("备注已保存");
                  await refresh();
                }}
              >
                保存
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

