import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  FileItem,
  NavTabType,
  FilterCategory,
  ViewMode,
  TocItem,
  ReaderSettings,
  SaveStatus,
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
  buildDirectoryFromHandle,
  openDirectoryWithPicker,
  saveFileContent,
  checkFileModified,
  isFileSystemAccessSupported,
} from "./services/localDirectoryService";
import { NavTabs } from "./components/Sidebar/NavTabs";
import { FileTree } from "./components/Sidebar/FileTree";
import { ProjectFooter } from "./components/Sidebar/ProjectFooter";
import { ViewerHeader } from "./components/Viewer/ViewerHeader";
import { MarkdownViewer } from "./components/Viewer/MarkdownViewer";
import { CodeViewer } from "./components/Viewer/CodeViewer";
import { PlainTextViewer } from "./components/Viewer/PlainTextViewer";
import { EditorViewer } from "./components/Viewer/EditorViewer";
import { TocDrawer } from "./components/Viewer/TocDrawer";
import { FolderOpenIcon } from "./components/Icons";

export const App: React.FC = () => {
  // 基础项目与文件状态（支持读写双向同步与外部热感知）
  const [project, setProject] = useState<FileItem | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>("");
  const [activeContent, setActiveContent] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // 同步与编辑状态
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [externalSyncTip, setExternalSyncTip] = useState<string>("");
  const [isRefreshingDirectory, setIsRefreshingDirectory] = useState<boolean>(false);

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

  // 当激活文件变更时，按需动态读取其正文内容
  useEffect(() => {
    if (!activeFile) {
      setActiveContent("");
      setSaveStatus("idle");
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
        setSaveStatus("idle");
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [activeFile]);

  // 保存当前内容至物理磁盘
  const handleSave = useCallback(async () => {
    if (!activeFile) return;
    if (!activeFile.fileHandle) {
      alert("当前文件未获得本地写入授权（可能通过只读降级模式打开）");
      return;
    }
    setSaveStatus("saving");
    try {
      await saveFileContent(activeFile, activeContent);
      setSaveStatus("saved");
      setExternalSyncTip("");
      setTimeout(() => {
        setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
      }, 2000);
    } catch (err) {
      console.error("保存物理文件失败:", err);
      setSaveStatus("error");
      alert(`保存失败: ${(err as Error).message}`);
    }
  }, [activeFile, activeContent]);

  // 检测外部工具（VSCode/AI/脚本）对本地文件的修改
  const checkExternalChange = useCallback(async () => {
    if (!activeFile || !activeFile.fileHandle || !activeFile.lastModified) return;

    try {
      const isModified = await checkFileModified(activeFile);
      if (isModified) {
        if (saveStatus === "dirty") {
          const reload = window.confirm(
            `【外部更新提示】物理文件《${activeFile.name}》已被外部工具修改！\n是否重新载入最新内容？（当前界面的未保存草稿将被覆盖）`
          );
          if (!reload) return;
        }

        const freshText = await readFileContent(activeFile, true);
        setActiveContent(freshText);
        setSaveStatus("idle");
        setExternalSyncTip("外部修改已同步");
        setTimeout(() => setExternalSyncTip(""), 3500);
      }
    } catch (err) {
      console.warn("检查外部文件变动失败:", err);
    }
  }, [activeFile, saveStatus]);

  // 窗口聚焦感知与轻量定时轮询
  useEffect(() => {
    const handleFocus = () => {
      void checkExternalChange();
    };
    window.addEventListener("focus", handleFocus);

    const timer = setInterval(() => {
      void checkExternalChange();
    }, 2500);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(timer);
    };
  }, [checkExternalChange]);

  // 全局 Ctrl+S / Cmd+S 快捷保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // 切换选中文件
  const handleSelectFile = (file: FileItem) => {
    if (file.id === activeFileId) return;
    if (saveStatus === "dirty") {
      const confirmed = window.confirm(
        "当前文件有未保存的修改，切换文件将丢弃未保存内容，是否确认切换？"
      );
      if (!confirmed) return;
    }
    setActiveFileId(file.id);
    setSaveStatus("idle");
    setExternalSyncTip("");
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

  // 打开本地目录
  const handleDirectoryOpened = (newProject: FileItem) => {
    setProject(newProject);
    setSaveStatus("idle");
    setExternalSyncTip("");
    setIsEditing(false);

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

  // 重新扫描并同步刷新磁盘目录树
  const handleRefreshDirectory = async () => {
    if (!project || !project.dirHandle) return;
    setIsRefreshingDirectory(true);
    try {
      const refreshed = await buildDirectoryFromHandle(project.dirHandle);
      setProject(refreshed);

      if (activeFileId) {
        const file = findFileById(refreshed, activeFileId);
        if (file) {
          const fresh = await readFileContent(file, true);
          setActiveContent(fresh);
          setSaveStatus("idle");
        }
      }
    } catch (err) {
      console.error("刷新目录树失败:", err);
    } finally {
      setIsRefreshingDirectory(false);
    }
  };

  const globalFolderInputRef = useRef<HTMLInputElement>(null);

  // 快捷打开文件夹（优先唤起原生系统授权读写选择器）
  const handleTriggerOpen = async () => {
    if (isFileSystemAccessSupported()) {
      try {
        const rootProject = await openDirectoryWithPicker();
        if (rootProject) {
          handleDirectoryOpened(rootProject);
          return;
        }
        return;
      } catch (err) {
        console.warn("现代文件选择器唤起失败，降级为原生文件输入", err);
      }
    }
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
    setIsEditing(false);
    setSaveStatus("idle");
    setExternalSyncTip("");
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

        {/* 底部目录栏（打开本地文件夹 / 切换文件夹 / 刷新 / 关闭当前目录） */}
        <ProjectFooter
          project={project}
          isRefreshing={isRefreshingDirectory}
          onDirectoryOpened={handleDirectoryOpened}
          onCloseDirectory={handleCloseDirectory}
          onRefreshDirectory={project?.dirHandle ? handleRefreshDirectory : undefined}
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
              isEditing={isEditing}
              saveStatus={saveStatus}
              canWrite={Boolean(activeFile?.fileHandle)}
              externalSyncTip={externalSyncTip}
              onToggleSidebar={handleToggleSidebar}
              onViewModeChange={setViewMode}
              onToggleLineNumbers={handleToggleLineNumbers}
              onToggleWordWrap={handleToggleWordWrap}
              onFontSizeChange={handleFontSizeChange}
              onToggleToc={() => setIsTocOpen((prev) => !prev)}
              onToggleEditing={() => setIsEditing((prev) => !prev)}
              onSave={handleSave}
            />

            {/* 主内容区域 */}
            <div
              className={`viewer-content-viewport ${
                !isEditing && viewMode !== "markdown" ? "full-width" : ""
              }`}
            >
              {isLoadingContent ? (
                <div className="viewer-loading-tip">正在读取文件内容...</div>
              ) : activeFile ? (
                isEditing ? (
                  <EditorViewer
                    content={activeContent}
                    onChange={(newVal) => {
                      setActiveContent(newVal);
                      setSaveStatus("dirty");
                    }}
                    onSave={handleSave}
                    fontSize={settings.fontSize}
                    showLineNumbers={settings.showLineNumbers}
                    wordWrap={settings.wordWrap}
                  />
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
                )
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
                  alt="PageBox 目录速览"
                  className="welcome-logo-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <h1 className="welcome-title">PageBox — 目录速览</h1>
              <p className="welcome-subtitle">
                专为本地多级目录树、结构化文本与代码打造的极速查看器
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
