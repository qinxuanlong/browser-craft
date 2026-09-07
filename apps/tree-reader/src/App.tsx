import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileItem,
  NavTabType,
  FilterCategory,
  ViewMode,
  TocItem,
  ReaderSettings,
} from "./types";
import { DEMO_PROJECT } from "./services/demoProject";
import {
  loadSettings,
  saveSettings,
  loadExpandedFolders,
  saveExpandedFolders,
  loadActiveFileId,
  saveActiveFileId,
  loadCurrentProject,
  saveCurrentProject,
  DEFAULT_SETTINGS,
} from "./services/storage";
import { classifyFile } from "./services/fileClassifier";
import { NavTabs } from "./components/Sidebar/NavTabs";
import { FileTree } from "./components/Sidebar/FileTree";
import { ProjectFooter } from "./components/Sidebar/ProjectFooter";
import { ViewerHeader } from "./components/Viewer/ViewerHeader";
import { MarkdownViewer } from "./components/Viewer/MarkdownViewer";
import { CodeViewer } from "./components/Viewer/CodeViewer";
import { PlainTextViewer } from "./components/Viewer/PlainTextViewer";
import { TocDrawer } from "./components/Viewer/TocDrawer";

export const App: React.FC = () => {
  // 基础项目与文件状态
  const [project, setProject] = useState<FileItem>(DEMO_PROJECT);
  const [activeFileId, setActiveFileId] = useState<string>("file-main");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["folder-archive"])
  );

  // 设置与视图配置
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("markdown");
  const [tocList, setTocList] = useState<TocItem[]>([]);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);

  // 递归寻找指定 ID 的文件
  const findFileById = useCallback(
    (root: FileItem, targetId: string): FileItem | null => {
      if (root.id === targetId && root.type === "file") return root;
      if (root.children) {
        for (const child of root.children) {
          const found = findFileById(child, targetId);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  // 获取首个叶子文件
  const findFirstFile = useCallback((root: FileItem): FileItem | null => {
    if (root.type === "file") return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findFirstFile(child);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // 当前激活的文件对象
  const activeFile = useMemo(() => {
    return findFileById(project, activeFileId) || findFirstFile(project);
  }, [project, activeFileId, findFileById, findFirstFile]);

  // 初始化加载持久化数据
  useEffect(() => {
    const initData = async () => {
      const [savedSettings, savedFolders, savedActiveId, savedProject] =
        await Promise.all([
          loadSettings(),
          loadExpandedFolders(),
          loadActiveFileId(),
          loadCurrentProject(),
        ]);

      setSettings(savedSettings);
      setExpandedFolders(new Set(savedFolders));
      setProject(savedProject);
      setActiveFileId(savedActiveId);
    };

    void initData();
  }, []);

  // 当激活文件变更时，自动识别并配置适宜的查看模式
  useEffect(() => {
    if (!activeFile) return;
    const { defaultMode } = classifyFile(activeFile.name);
    setViewMode(defaultMode);
  }, [activeFile]);

  // 切换选中文件
  const handleSelectFile = (file: FileItem) => {
    setActiveFileId(file.id);
    void saveActiveFileId(file.id);
  };

  // 折叠/展开文件夹
  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      void saveExpandedFolders(Array.from(next));
      return next;
    });
  };

  // 切换侧边栏收起/展开
  const handleToggleSidebar = () => {
    setSettings((prev) => {
      const next = { ...prev, isSidebarCollapsed: !prev.isSidebarCollapsed };
      void saveSettings(next);
      return next;
    });
  };

  // 调节字号
  const handleFontSizeChange = (delta: number) => {
    setSettings((prev) => {
      const next = { ...prev, fontSize: Math.max(12, Math.min(26, prev.fontSize + delta)) };
      void saveSettings(next);
      return next;
    });
  };

  // 切换行号
  const handleToggleLineNumbers = () => {
    setSettings((prev) => {
      const next = { ...prev, showLineNumbers: !prev.showLineNumbers };
      void saveSettings(next);
      return next;
    });
  };

  // 切换换行
  const handleToggleWordWrap = () => {
    setSettings((prev) => {
      const next = { ...prev, wordWrap: !prev.wordWrap };
      void saveSettings(next);
      return next;
    });
  };

  // 切换 Nav Tab
  const handleTabChange = (tab: NavTabType) => {
    setSettings((prev) => {
      const next = { ...prev, activeTab: tab };
      void saveSettings(next);
      return next;
    });
  };

  // 导入自定义项目
  const handleImportProject = (newProject: FileItem) => {
    setProject(newProject);
    void saveCurrentProject(newProject);
    const first = findFirstFile(newProject);
    if (first) {
      setActiveFileId(first.id);
      void saveActiveFileId(first.id);
    }
    // 默认展开顶层目录
    const topDirs = (newProject.children || [])
      .filter((c) => c.type === "directory")
      .map((c) => c.id);
    setExpandedFolders(new Set(topDirs));
    void saveExpandedFolders(topDirs);
  };

  // 恢复默认示例
  const handleResetDemo = () => {
    setProject(DEMO_PROJECT);
    void saveCurrentProject(DEMO_PROJECT);
    setActiveFileId("file-main");
    void saveActiveFileId("file-main");
    setExpandedFolders(new Set(["folder-archive"]));
    void saveExpandedFolders(["folder-archive"]);
    setSearchQuery("");
  };

  return (
    <div className="treereader-root">
      {/* 左侧侧边栏 (导航 + 文件树 + 纯净状态栏) */}
      <aside
        className={`treereader-sidebar ${settings.isSidebarCollapsed ? "collapsed" : ""}`}
      >
        {/* 顶部 Tab 导航 (对标原图四个图标) */}
        <NavTabs
          activeTab={settings.activeTab}
          onTabChange={handleTabChange}
        />

        {/* 搜索模式输入框 */}
        {settings.activeTab === "search" && (
          <div className="sidebar-search-bar">
            <input
              type="text"
              className="sidebar-search-input"
              placeholder="搜索文件名或文本内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* 过滤模式选择器 */}
        {settings.activeTab === "filter" && (
          <div className="sidebar-filter-selector">
            {(["all", "markdown", "code", "text"] as FilterCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-chip ${settings.filterCategory === cat ? "active" : ""}`}
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, filterCategory: cat }))
                  }
                >
                  {cat === "all"
                    ? "全部"
                    : cat === "markdown"
                    ? "文档"
                    : cat === "code"
                    ? "代码"
                    : "纯文本"}
                </button>
              )
            )}
          </div>
        )}

        {/* 文件树核心组件 (对标原图树形布局) */}
        <FileTree
          project={project}
          activeFileId={activeFileId}
          expandedFolders={expandedFolders}
          filterCategory={settings.filterCategory}
          searchQuery={searchQuery}
          isListView={settings.activeTab === "list"}
          onSelectFile={handleSelectFile}
          onToggleFolder={handleToggleFolder}
        />

        {/* 纯净底栏状态 (无收费广告) */}
        <ProjectFooter
          project={project}
          onImportProject={handleImportProject}
          onResetDemo={handleResetDemo}
        />
      </aside>

      {/* 右侧主查看与阅读视窗 */}
      <main className="treereader-main">
        {/* 顶置控制栏 (对标截图) */}
        <ViewerHeader
          isSidebarCollapsed={settings.isSidebarCollapsed}
          viewMode={viewMode}
          showLineNumbers={settings.showLineNumbers}
          wordWrap={settings.wordWrap}
          fontSize={settings.fontSize}
          hasToc={tocList.length > 0}
          isTocOpen={isTocOpen}
          currentContent={activeFile?.content || ""}
          onToggleSidebar={handleToggleSidebar}
          onViewModeChange={setViewMode}
          onToggleLineNumbers={handleToggleLineNumbers}
          onToggleWordWrap={handleToggleWordWrap}
          onFontSizeChange={handleFontSizeChange}
          onToggleToc={() => setIsTocOpen((prev) => !prev)}
        />

        {/* 主内容区域 */}
        <div className={`viewer-content-viewport ${viewMode !== "markdown" ? "full-width" : ""}`}>
          {viewMode === "markdown" && (
            <MarkdownViewer
              content={activeFile?.content || ""}
              fontSize={settings.fontSize}
              wordWrap={settings.wordWrap}
              onTocExtracted={setTocList}
            />
          )}

          {viewMode === "code" && (
            <CodeViewer
              code={activeFile?.content || ""}
              language={activeFile?.language || "typescript"}
              fontSize={settings.fontSize}
              showLineNumbers={settings.showLineNumbers}
              wordWrap={settings.wordWrap}
            />
          )}

          {viewMode === "text" && (
            <PlainTextViewer
              text={activeFile?.content || ""}
              fontSize={settings.fontSize}
              showLineNumbers={settings.showLineNumbers}
              wordWrap={settings.wordWrap}
            />
          )}
        </div>

        {/* 章节大纲 TOC 抽屉 */}
        <TocDrawer
          isOpen={isTocOpen}
          tocList={tocList}
          onClose={() => setIsTocOpen(false)}
        />
      </main>
    </div>
  );
};
