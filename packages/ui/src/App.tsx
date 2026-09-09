import { useCallback, useEffect, useRef, useState } from "react";
import { openManagerPage, pageBoxService, subscribeToBookmarks } from "@pagebox/core";
import type { Folder, SavedTab, SavedWindow } from "@pagebox/types";
import { FolderTree, type FolderTreeRef } from "./FolderTree";
import { TabFavicon } from "./Favicon";
import {
  BookmarkPlusIcon,
  CloseIcon,
  CrownIcon,
  ExternalLinkIcon,
  PageBoxLogo,
  SidebarIcon,
  UnfoldLessIcon,
  UnfoldMoreIcon,
  WindowSaveIcon,
} from "./icons";
import { LicenseModal } from "./LicenseModal";
import { useLicense } from "./useLicense";
import { copyToClipboard, formatTabToMarkdown } from "./clipboard";
import { I18nProvider, useTranslation } from "./i18n";
import { ThemeProvider } from "./ThemeContext";
import "./styles.css";

export type AppVariant = "popup" | "sidepanel";

interface PageBoxAppProps {
  variant?: AppVariant;
}

function PageBoxAppInner({ variant = "popup" }: PageBoxAppProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [windows, setWindows] = useState<SavedWindow[]>([]);
  const [status, setStatus] = useState("");
  const [notesTarget, setNotesTarget] = useState<SavedTab | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const treeRef = useRef<FolderTreeRef>(null);

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
      const message = error instanceof Error ? error.message : "Error";
      showStatus(message);
    }
  };

  const handleSaveTab = () =>
    runAction(async () => {
      await pageBoxService.saveCurrentTab();
    }, t.popup.saveTabSuccess);

  const handleSaveWindow = () =>
    runAction(async () => {
      await pageBoxService.saveCurrentWindow();
    }, t.popup.saveWindowSuccess);

  const handleRestoreTab = async (tab: SavedTab) => {
    await pageBoxService.restoreTab(tab.id);
    showStatus(t.manager.openedTab);
  };

  const handleRestoreWindow = async (win: SavedWindow) => {
    await pageBoxService.restoreWindow(win.id);
    showStatus(t.manager.restoredTabs(win.tabs.length));
  };

  const handleCopyTab = async (tab: SavedTab) => {
    const text = formatTabToMarkdown(tab);
    const ok = await copyToClipboard(text);
    if (ok) {
      showStatus(t.manager.copySingleSuccess);
    } else {
      showStatus(t.manager.copyFailed);
    }
  };

  const handleDeleteTab = async (tab: SavedTab) => {
    await pageBoxService.deleteTab(tab.id);
    showStatus(t.manager.deleted);
    await refresh();
  };

  const handleDeleteWindow = async (win: SavedWindow) => {
    await pageBoxService.deleteWindow(win.id);
    showStatus(t.manager.deleted);
    await refresh();
  };

  const openNotes = (tab: SavedTab) => {
    setNotesTarget(tab);
    setNotesDraft(tab.notes ?? "");
  };

  const saveNotes = async () => {
    if (!notesTarget) return;
    await pageBoxService.updateTabNotes(notesTarget.id, notesDraft);
    setNotesTarget(null);
    showStatus(t.manager.notesSaved);
    await refresh();
  };

  const isEmpty = tabs.length === 0 && windows.length === 0;
  const isSearching = query.trim().length > 0;

  return (
    <div className={`pagebox-app pagebox-app--${variant}`}>
      <header className="pagebox-header">
        <div className="pagebox-header__brand">
          {variant !== "sidepanel" && (
            <>
              <PageBoxLogo size={18} />
              <h1>PageBox</h1>
            </>
          )}
          {isPro ? (
            <button
              type="button"
              className="pagebox-pro-badge pagebox-pro-badge--active"
              onClick={() => setLicenseModalOpen(true)}
              title={t.header.proActiveTitle}
            >
              <CrownIcon size={11} />
              <span>{t.header.proBadge}</span>
            </button>
          ) : (
            <button
              type="button"
              className="pagebox-pro-badge pagebox-pro-badge--upgrade"
              onClick={() => setLicenseModalOpen(true)}
              title={t.header.upgradeProTitle}
            >
              <CrownIcon size={11} />
              <span>{t.header.upgradePro}</span>
            </button>
          )}
        </div>

        <div className="pagebox-header__actions">
          {/* 保存当前标签页（主要高频操作） */}
          <button
            type="button"
            className="pagebox-header-btn pagebox-header-btn--primary"
            onClick={handleSaveTab}
            title={t.header.saveTabTitle}
            aria-label={t.header.saveTabTitle}
          >
            <BookmarkPlusIcon size={14} />
          </button>
          {/* 保存当前窗口所有标签页 */}
          <button
            type="button"
            className="pagebox-header-btn"
            onClick={handleSaveWindow}
            title={t.header.saveWindowTitle}
            aria-label={t.header.saveWindowTitle}
          >
            <WindowSaveIcon size={14} />
          </button>
          <div className="pagebox-header__divider" />
          {/* 在新标签页打开后台管理页面（支持完整导入导出与系统设置） */}
          <button
            type="button"
            className="pagebox-header-btn pagebox-header-btn--highlight"
            onClick={() => void openManagerPage()}
            title={t.header.openManagerTitle}
            aria-label={t.header.openManagerTitle}
          >
            <ExternalLinkIcon size={14} />
          </button>
          {/* Popup 视图支持一键切换展开侧边栏 */}
          {variant === "popup" && (
            <button
              type="button"
              className="pagebox-header-btn"
              onClick={() => {
                void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
                  if (tab?.windowId !== undefined) {
                    void chrome.sidePanel.open({ windowId: tab.windowId });
                  }
                });
              }}
              title={t.header.openSidepanelTitle}
              aria-label={t.header.openSidepanelTitle}
            >
              <SidebarIcon size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="pagebox-search">
        <input
          type="search"
          placeholder={t.search.popupPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <main className="pagebox-content">
        {isEmpty && (
          <div className="pagebox-empty">
            <p>{t.popup.emptyTitle}</p>
            <p>{t.popup.emptyDesc}</p>
            <p className="pagebox-empty__hint">
              {t.popup.emptyHint}
            </p>
          </div>
        )}

        {isSearching && windows.length > 0 && (
          <>
            <div className="pagebox-section-title">{t.popup.windowsSection(windows.length)}</div>
            {windows.map((win) => (
              <div key={win.id} className="pagebox-item" onClick={() => handleRestoreWindow(win)}>
                <div className="pagebox-item__body">
                  <div className="pagebox-item__title">{win.name}</div>
                  <div className="pagebox-item__url">{t.tree.tabsCount(win.tabs.length)}</div>
                  {win.notes && <div className="pagebox-item__notes">{win.notes}</div>}
                </div>
                <div className="pagebox-item__actions" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDeleteWindow(win)}>{t.common.delete}</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tabs.length > 0 && (
          <>
            <div className="pagebox-section-header">
              <div className="pagebox-section-title">
                {isSearching ? t.search.results(tabs.length) : t.search.treeTitle(tabs.length)}
              </div>
              {!isSearching && (
                <div className="pagebox-tree-header-actions">
                  <button
                    type="button"
                    className="pagebox-tree-tool-btn"
                    onClick={() => treeRef.current?.expandAll()}
                    title={t.sidebar.expandAll}
                    aria-label={t.sidebar.expandAll}
                  >
                    <UnfoldMoreIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="pagebox-tree-tool-btn"
                    onClick={() => treeRef.current?.collapseAll()}
                    title={t.sidebar.collapseAll}
                    aria-label={t.sidebar.collapseAll}
                  >
                    <UnfoldLessIcon size={14} />
                  </button>
                </div>
              )}
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
                    <button
                      onClick={() => void handleCopyTab(tab)}
                      title={t.manager.copyMarkdownTitle}
                    >
                      {t.common.copy}
                    </button>
                    <button onClick={() => openNotes(tab)}>{t.common.notes}</button>
                    <button onClick={() => handleDeleteTab(tab)}>{t.common.delete}</button>
                  </div>
                </div>
              ))
            ) : (
              <FolderTree
                ref={treeRef}
                folders={folders}
                tabs={tabs}
                windows={windows}
                mode="full"
                onRestoreTab={handleRestoreTab}
                onCopyTab={handleCopyTab}
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
                  void saveNotes();
                }
                if (e.key === "Escape") setNotesTarget(null);
              }}
            />
            <div className="pagebox-modal__actions">
              <button className="pagebox-btn" onClick={() => setNotesTarget(null)}>
                {t.common.cancel}
              </button>
              <button className="pagebox-btn pagebox-btn--primary" onClick={saveNotes}>
                {t.common.save}
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

export function PageBoxApp(props: PageBoxAppProps) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <PageBoxAppInner {...props} />
      </I18nProvider>
    </ThemeProvider>
  );
}

export { PageBoxApp as default };
