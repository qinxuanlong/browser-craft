import { useCallback, useEffect, useState } from "react";
import { openManagerPage, pageBoxService } from "@pagebox/core";
import type { Folder, SavedTab, SavedWindow } from "@pagebox/types";
import { FolderTree } from "./FolderTree";
import { SyncModal } from "./SyncModal";
import { ExternalLinkIcon } from "./icons";
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
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    const store = await pageBoxService.getStore();
    const result = await pageBoxService.search(query);
    setFolders(store.folders);
    setTabs(result.tabs);
    setWindows(result.windows);
  }, [query]);

  useEffect(() => {
    void refresh();

    const onStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === "local" && changes.pagebox_store) {
        void refresh();
      }
    };
    chrome.storage.onChanged.addListener(onStorageChange);
    return () => chrome.storage.onChanged.removeListener(onStorageChange);
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
        <h1>PageBox</h1>
      </header>

      <div className="pagebox-toolbar">
        <button className="pagebox-btn pagebox-btn--primary" onClick={handleSaveTab}>
          收藏标签
        </button>
        <button className="pagebox-btn" onClick={handleSaveWindow}>
          收藏窗口
        </button>
        <button className="pagebox-btn" onClick={handleExport}>
          导出
        </button>
        <button className="pagebox-btn" onClick={handleImport}>
          导入
        </button>
        <button
          className="pagebox-btn"
          onClick={() => setSyncModalOpen(true)}
          title="打开书签双向同步中心（浏览器 ⇄ 插件）"
        >
          双向同步
        </button>
        <button
          className="pagebox-btn pagebox-btn--highlight"
          onClick={() => void openManagerPage()}
          title="在新标签页中打开完整管理中心"
        >
          <ExternalLinkIcon size={12} /> 管理页
        </button>
        {variant === "popup" && (
          <button
            className="pagebox-btn"
            onClick={() => {
              void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
                if (tab?.windowId !== undefined) {
                  void chrome.sidePanel.open({ windowId: tab.windowId });
                }
              });
            }}
          >
            侧边栏
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
            <p>暂无收藏</p>
            <p>切换到普通网页后，点击「收藏标签」保存</p>
            <p>或点击「同步书签」拉取浏览器收藏夹</p>
            <p className="pagebox-empty__hint">
              数据保存在本机，重新加载扩展后可能丢失；建议定期「导出」备份
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
                  {tab.favIconUrl && (
                    <img className="pagebox-item__icon" src={tab.favIconUrl} alt="" />
                  )}
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
            <h2>编辑备注</h2>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="添加备注…"
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

      {/* 书签双向同步中心弹窗 */}
      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSuccess={(msg) => {
          showStatus(msg);
          void refresh();
        }}
      />
    </div>
  );
}

export { PageBoxApp as default };
