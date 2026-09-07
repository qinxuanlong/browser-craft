import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileItem,
  NavTabType,
  FilterCategory,
  ViewMode,
  TocItem,
  ReaderSettings,
} from "./types";
import {
  loadSettings,
  saveSettings,
  loadExpandedFolders,
  saveExpandedFolders,
  DEFAULT_SETTINGS,
} from "./services/storage";
import { classifyFile } from "./services/fileClassifier";
import {
  readFileContent,
  buildDirectoryFromFileList,
} from "./services/localDirectoryService";
import { NavTabs } from "./components/Sidebar/NavTabs";
import { FileTree } from "./components/Sidebar/FileTree";
import { ProjectFooter } from "./components/Sidebar/ProjectFooter";
import { ViewerHeader } from "./components/Viewer/ViewerHeader";
import { MarkdownViewer } from "./components/Viewer/MarkdownViewer";
import { CodeViewer } from "./components/Viewer/CodeViewer";
import { PlainTextViewer } from "./components/Viewer/PlainTextViewer";
import { TocDrawer } from "./components/Viewer/TocDrawer";
import { FolderOpenIcon } from "./components/Icons";

export const App: React.FC = () => {
  // 基础项目与文件状态（100% 纯本地内存浏览，绝无假数据或示例）
  const [project, setProject] = useState<FileItem | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>("");
  const [activeContent, setActiveContent] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // 设置与视图配置
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("markdown");
  const [tocList, setTocList] = useState<TocItem[]>([]);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // 递归寻找指定 ID 的文件
  const findFileById = useCallback(
    (root: FileItem | null, targetId: string): FileItem | null => {
      if (!root) return null;
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
  const findFirstFile = useCallback((root: FileItem | null): FileItem | null => {
    if (!root) return null;
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
    if (!project) return null;
    return findFileById(project, activeFileId) || findFirstFile(project);
  }, [project, activeFileId, findFileById, findFirstFile]);

  // 初始化加载偏好配置（字号、展开状态等轻量配置）
  useEffect(() => {
    const initData = async () => {
      const [savedSettings, savedFolders] = await Promise.all([
        loadSettings(),
        loadExpandedFolders(),
      ]);

      setSettings(savedSettings);
      setExpandedFolders(new Set(savedFolders));
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

  const globalFolderInputRef = useRef<HTMLInputElement>(null);

  // 快捷打开文件夹（直接触发系统标准选择器，无浏览器创建副本弹窗）
  const handleTriggerOpen = () => {
    globalFolderInputRef.current?.click();
  };

  const handleGlobalFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const rootProject = buildDirectoryFromFileList(files);
    handleDirectoryOpened(rootProject);
    if (globalFolderInputRef.current) {
      globalFolderInputRef.current.value = "";
    }
  };

  // 关闭当前已打开的目录
  const handleCloseDirectory = () => {
    setProject(null);
    setActiveFileId("");
    setActiveContent("");
    setExpandedFolders(new Set());
    setSearchQuery("");
  };

  // 拖拽文件夹进入窗口快速打开（纯本地只读，不触发复制权限确认）
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const rootProject = buildDirectoryFromFileList(e.dataTransfer.files);
      handleDirectoryOpened(rootProject);
    }
  };

  return (
    <div
      className={`treereader-root ${isDraggingOver ? "dragging-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 全局标准文件夹选择器（零安全权限确认、零复制、纯只读） */}
      <input
        ref={globalFolderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory 原生属性
        webkitdirectory=""
        style={{ display: "none" }}
        onChange={handleGlobalFolderChange}
      />

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

        {/* 文件树核心组件（无项目时展示优雅引导） */}
        <FileTree
          project={project}
          activeFileId={activeFileId}
          expandedFolders={expandedFolders}
          filterCategory={settings.filterCategory}
          searchQuery={searchQuery}
          isListView={settings.activeTab === "list"}
          onSelectFile={handleSelectFile}
          onToggleFolder={handleToggleFolder}
          onOpenDirectory={handleTriggerOpen}
        />

        {/* 底部目录栏（打开本地文件夹 / 切换文件夹 / 关闭当前目录） */}
        <ProjectFooter
          project={project}
          onDirectoryOpened={handleDirectoryOpened}
          onCloseDirectory={handleCloseDirectory}
        />
      </aside>

      {/* 右侧主查看与阅读视窗 */}
      <main className="treereader-main">
        {project ? (
          <>
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
              ) : activeFile ? (
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
              ) : (
                <div className="viewer-empty-placeholder">
                  👈 请从左侧目录树中选择文件开始查看
                </div>
              )}
            </div>

            {/* 章节大纲 TOC 抽屉 */}
            <TocDrawer
              isOpen={isTocOpen}
              tocList={tocList}
              onClose={() => setIsTocOpen(false)}
            />
          </>
        ) : (
          /* 未打开任何文件夹时的纯净大气主页 */
          <div className="main-welcome-screen">
            <div className="welcome-card">
              <div className="welcome-logo-badge">
                <img
                  src="/icons/icon-128.png"
                  alt="TreeReader"
                  className="welcome-logo-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <h1 className="welcome-title">TreeReader — 树读</h1>
              <p className="welcome-subtitle">
                专为本地小说、文档大纲与代码打造的轻量级目录树查看器
              </p>

              <div className="welcome-action-box">
                <button
                  type="button"
                  className="welcome-open-btn"
                  onClick={handleTriggerOpen}
                >
                  <FolderOpenIcon size={18} />
                  <span>打开本地文件夹</span>
                </button>
                <div className="welcome-drag-hint">
                  或直接将本地文件夹拖入浏览器窗口
                </div>
              </div>

              <div className="welcome-features-grid">
                <div className="feature-item">
                  <div className="feature-icon">⚡</div>
                  <div className="feature-text">
                    <strong>秒级毫秒渲染</strong>
                    <span>仅按需实时只读读取，万级大目录瞬间打开</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔒</div>
                  <div className="feature-text">
                    <strong>纯本地隐私安全</strong>
                    <span>100% 离线运行，不上传任何内容，无数据残留</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📖</div>
                  <div className="feature-text">
                    <strong>多模态排版支持</strong>
                    <span>支持 Markdown 沉浸排版、代码语法高亮与系统日志</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
