import { useCallback, useEffect, useState } from "react";
import { openManagerPage, pageBoxService, subscribeToBookmarks } from "@pagebox/core";
import type { Folder, SavedTab, SavedWindow } from "@pagebox/types";
import { FolderTree } from "./FolderTree";
import { TabFavicon } from "./Favicon";
import {
  BookmarkPlusIcon,
  CloseIcon,
  CrownIcon,
  ExternalLinkIcon,
  ExportIcon,
  ImportIcon,
  PageBoxLogo,
  SidebarIcon,
  WindowSaveIcon,
} from "./icons";
import { LicenseModal } from "./LicenseModal";
import { useLicense } from "./useLicense";
import "./styles.css";

export type AppVariant = "popup" | "sidepanel";

interface PageBoxAppProps {
  variant?: AppVariant;
}

export function PageBoxApp({ variant = "popup" }: PageBoxAppProps) {
  const [query, setQuery] = useState("");
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [windows, setWindows] = useState<SavedWindow[]>([]);
  const [status, setStatus] = useState("");
  const [notesTarget, setNotesTarget] = useState<SavedTab | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  const { isPro } = useLicense();

  const refresh = useCallback(async () => {
    const store = await pageBoxService.getStore();
    const result = await pageBoxService.search(query);
    setFolders(store.folders);
    setTabs(result.tabs);
    setWindows(result.windows);
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

  const runAction = async (action: () => Promise<void>, successMsg: string) => {
    try {
      await action();
      showStatus(successMsg);
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "操作失败";
      showStatus(message);
    }
  };

  const handleSaveTab = () =>
    runAction(async () => {
      await pageBoxService.saveCurrentTab();
    }, "已收藏当前标签页");

  const handleSaveWindow = () =>
    runAction(async () => {
      await pageBoxService.saveCurrentWindow();
    }, "已收藏当前窗口");

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
    showStatus("已删除");
    await refresh();
  };

  const handleDeleteWindow = async (win: SavedWindow) => {
    await pageBoxService.deleteWindow(win.id);
    showStatus("已删除");
    await refresh();
  };

  const handleExport = async () => {
    const data = await pageBoxService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagebox-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus("导出完成");
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
        showStatus("导入完成");
        await refresh();
      } catch {
        showStatus("导入失败，请检查 JSON 文件");
      }
    };
    input.click();
  };

  const openNotes = (tab: SavedTab) => {
    setNotesTarget(tab);
    setNotesDraft(tab.notes ?? "");
  };

  const saveNotes = async () => {
    if (!notesTarget) return;
    await pageBoxService.updateTabNotes(notesTarget.id, notesDraft);
    setNotesTarget(null);
    showStatus("备注已保存");
    await refresh();
  };

  const isEmpty = tabs.length === 0 && windows.length === 0;
  const isSearching = query.trim().length > 0;

  return (
    <div className={`pagebox-app pagebox-app--${variant}`}>
      <header className="pagebox-header">
        <div className="pagebox-header__brand">
          <PageBoxLogo size={20} />
          <h1>PageBox</h1>
        </div>
        <div className="pagebox-header__extra">
          {isPro ? (
            <button
              type="button"
              className="pagebox-pro-badge pagebox-pro-badge--active"
              onClick={() => setLicenseModalOpen(true)}
              title="Pro 尊享特权生效中，点击查看授权"
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
      </header>

      <div className="pagebox-toolbar">
        <button
          className="pagebox-btn-icon pagebox-btn-icon--primary"
          onClick={handleSaveTab}
          title="收藏当前标签页"
          aria-label="收藏当前标签页"
        >
          <BookmarkPlusIcon size={16} />
        </button>
        <button
          className="pagebox-btn-icon"
          onClick={handleSaveWindow}
          title="收藏当前窗口所有标签"
          aria-label="收藏当前窗口所有标签"
        >
          <WindowSaveIcon size={16} />
        </button>
        <div className="pagebox-toolbar__divider" />
        <button
          className="pagebox-btn-icon"
          onClick={handleExport}
          title="导出数据备份 (JSON)"
          aria-label="导出数据备份"
        >
          <ExportIcon size={16} />
        </button>
        <button
          className="pagebox-btn-icon"
          onClick={handleImport}
          title="导入数据备份 (JSON)"
          aria-label="导入数据备份"
        >
          <ImportIcon size={16} />
        </button>
        <div className="pagebox-toolbar__spacer" />
        <button
          className="pagebox-btn-icon pagebox-btn-icon--highlight"
          onClick={() => void openManagerPage()}
          title="在新标签页中打开管理中心"
          aria-label="在新标签页中打开管理中心"
        >
          <ExternalLinkIcon size={14} />
        </button>
        {variant === "popup" && (
          <button
            className="pagebox-btn-icon"
            onClick={() => {
              void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
                if (tab?.windowId !== undefined) {
                  void chrome.sidePanel.open({ windowId: tab.windowId });
                }
              });
            }}
            title="在浏览器侧边栏中打开"
            aria-label="在浏览器侧边栏中打开"
          >
            <SidebarIcon size={16} />
          </button>
        )}
      </div>

      <div className="pagebox-search">
        <input
          type="search"
          placeholder="搜索标题、URL、备注、标签…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <main className="pagebox-content">
        {isEmpty && (
          <div className="pagebox-empty">
            <p>浏览器书签为空</p>
            <p>切换到普通网页后，点击「收藏标签」直接保存至浏览器书签</p>
            <p className="pagebox-empty__hint">
              与浏览器书签实时双向联动，修改即生效
            </p>
          </div>
        )}

        {isSearching && windows.length > 0 && (
          <>
            <div className="pagebox-section-title">窗口 ({windows.length})</div>
            {windows.map((win) => (
              <div key={win.id} className="pagebox-item" onClick={() => handleRestoreWindow(win)}>
                <div className="pagebox-item__body">
                  <div className="pagebox-item__title">{win.name}</div>
                  <div className="pagebox-item__url">{win.tabs.length} 个标签页</div>
                  {win.notes && <div className="pagebox-item__notes">{win.notes}</div>}
                </div>
                <div className="pagebox-item__actions" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDeleteWindow(win)}>删除</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tabs.length > 0 && (
          <>
            <div className="pagebox-section-title">
              {isSearching ? `搜索结果 (${tabs.length})` : `收藏目录树 (${tabs.length})`}
            </div>
            {isSearching ? (
              tabs.map((tab) => (
                <div key={tab.id} className="pagebox-item" onClick={() => handleRestoreTab(tab)}>
                  <TabFavicon
                    url={tab.url}
                    favIconUrl={tab.favIconUrl}
                    className="pagebox-item__icon"
                    size={16}
                  />
                  <div className="pagebox-item__body">
                    <div className="pagebox-item__title">{tab.title}</div>
                    <div className="pagebox-item__url">{tab.url}</div>
                    {tab.notes && <div className="pagebox-item__notes">{tab.notes}</div>}
                  </div>
                  <div className="pagebox-item__actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openNotes(tab)}>备注</button>
                    <button onClick={() => handleDeleteTab(tab)}>删除</button>
                  </div>
                </div>
              ))
            ) : (
              <FolderTree
                folders={folders}
                tabs={tabs}
                windows={windows}
                mode="full"
                onRestoreTab={handleRestoreTab}
                onDeleteTab={handleDeleteTab}
                onOpenNotes={openNotes}
                onRestoreWindow={handleRestoreWindow}
                onDeleteWindow={handleDeleteWindow}
              />
            )}
          </>
        )}
      </main>

      {status && <footer className="pagebox-status">{status}</footer>}

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
                  void saveNotes();
                }
                if (e.key === "Escape") setNotesTarget(null);
              }}
            />
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setNotesTarget(null)}>
                取消
              </button>
              <button className="pagebox-btn pagebox-btn--primary" onClick={saveNotes}>
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

export { PageBoxApp as default };
