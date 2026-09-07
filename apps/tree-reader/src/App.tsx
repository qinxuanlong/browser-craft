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
  DEFAULT_SETTINGS,
} from "./services/storage";
import { classifyFile } from "./services/fileClassifier";
import { readFileContent } from "./services/localDirectoryService";
import { NavTabs } from "./components/Sidebar/NavTabs";
import { FileTree } from "./components/Sidebar/FileTree";
import { ProjectFooter } from "./components/Sidebar/ProjectFooter";
import { ViewerHeader } from "./components/Viewer/ViewerHeader";
import { MarkdownViewer } from "./components/Viewer/MarkdownViewer";
import { CodeViewer } from "./components/Viewer/CodeViewer";
import { PlainTextViewer } from "./components/Viewer/PlainTextViewer";
import { TocDrawer } from "./components/Viewer/TocDrawer";

export const App: React.FC = () => {
  // 基础项目与文件状态（纯内存，不持久化任何大文本内容）
  const [project, setProject] = useState<FileItem>(DEMO_PROJECT);
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const [activeFileId, setActiveFileId] = useState<string>("file-main");
  const [activeContent, setActiveContent] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
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

  // 初始化加载偏好配置（字号、展开状态等轻量配置）
  useEffect(() => {
    const initData = async () => {
      const [savedSettings, savedFolders, savedActiveId] = await Promise.all([
        loadSettings(),
        loadExpandedFolders(),
        loadActiveFileId(),
      ]);

      setSettings(savedSettings);
      setExpandedFolders(new Set(savedFolders));
      setActiveFileId(savedActiveId);
    };

    void initData();
  }, []);

  // 当激活文件变更时，按需动态读取其正文内容（绝不持久化存储）
  useEffect(() => {
    if (!activeFile) {
      setActiveContent("");
      return;
    }

    // 自动根据后缀选择适宜的查看模式
    const { defaultMode } = classifyFile(activeFile.name);
    setViewMode(defaultMode);

    let isSubscribed = true;
    setIsLoadingContent(true);

    void readFileContent(activeFile).then((content) => {
      if (isSubscribed) {
        setActiveContent(content);
        setIsLoadingContent(false);
      }
    });

    return () => {
      isSubscribed = false;
    };
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
      const next = {
        ...prev,
        fontSize: Math.max(12, Math.min(26, prev.fontSize + delta)),
      };
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

  // 打开本地目录（纯内存浏览，不写入 storage）
  const handleDirectoryOpened = (newProject: FileItem) => {
    setProject(newProject);
    setIsDemo(false);

    const first = findFirstFile(newProject);
    if (first) {
      setActiveFileId(first.id);
    }

    // 默认展开首层目录
    const topDirs = (newProject.children || [])
      .filter((c) => c.type === "directory")
      .map((c) => c.id);
    setExpandedFolders(new Set(topDirs));
  };

  // 切换回演示小说
  const handleSwitchToDemo = () => {
    setProject(DEMO_PROJECT);
    setIsDemo(true);
    setActiveFileId("file-main");
    setExpandedFolders(new Set(["folder-archive"]));
    setSearchQuery("");
  };

  return (
    <div className="treereader-root">
      {/* 左侧侧边栏 (导航 + 文件树 + 纯净目录状态栏) */}
      <aside
        className={`treereader-sidebar ${
          settings.isSidebarCollapsed ? "collapsed" : ""
        }`}
      >
        {/* 顶部 Tab 导航 */}
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
                  className={`filter-chip ${
                    settings.filterCategory === cat ? "active" : ""
                  }`}
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

        {/* 文件树核心组件 */}
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

        {/* 底部目录栏（打开本地文件夹 / 纯只读查看） */}
        <ProjectFooter
          project={project}
          isDemo={isDemo}
          onDirectoryOpened={handleDirectoryOpened}
          onSwitchToDemo={handleSwitchToDemo}
        />
      </aside>

      {/* 右侧主查看与阅读视窗 */}
      <main className="treereader-main">
        {/* 顶置控制栏 */}
        <ViewerHeader
          isSidebarCollapsed={settings.isSidebarCollapsed}
          viewMode={viewMode}
          showLineNumbers={settings.showLineNumbers}
          wordWrap={settings.wordWrap}
          fontSize={settings.fontSize}
          hasToc={tocList.length > 0}
          isTocOpen={isTocOpen}
          currentContent={activeContent}
          onToggleSidebar={handleToggleSidebar}
          onViewModeChange={setViewMode}
          onToggleLineNumbers={handleToggleLineNumbers}
          onToggleWordWrap={handleToggleWordWrap}
          onFontSizeChange={handleFontSizeChange}
          onToggleToc={() => setIsTocOpen((prev) => !prev)}
        />

        {/* 主内容区域 */}
        <div
          className={`viewer-content-viewport ${
            viewMode !== "markdown" ? "full-width" : ""
          }`}
        >
          {isLoadingContent ? (
            <div className="viewer-loading-tip">正在读取文件内容...</div>
          ) : (
            <>
              {viewMode === "markdown" && (
                <MarkdownViewer
                  content={activeContent}
                  fontSize={settings.fontSize}
                  wordWrap={settings.wordWrap}
                  onTocExtracted={setTocList}
                />
              )}

              {viewMode === "code" && (
                <CodeViewer
                  code={activeContent}
                  language={activeFile?.language || "typescript"}
                  fontSize={settings.fontSize}
                  showLineNumbers={settings.showLineNumbers}
                  wordWrap={settings.wordWrap}
                />
              )}

              {viewMode === "text" && (
                <PlainTextViewer
                  text={activeContent}
                  fontSize={settings.fontSize}
                  showLineNumbers={settings.showLineNumbers}
                  wordWrap={settings.wordWrap}
                />
              )}
            </>
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
