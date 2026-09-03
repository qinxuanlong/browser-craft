import { useMemo, useState, type MouseEvent } from "react";
import type { Folder, SavedTab, SavedWindow } from "@pagebox/types";
import {
  ChevronDown,
  ChevronRight,
  FolderOpenYellowIcon,
  FolderYellowIcon,
  PlusIcon,
  TrashIcon,
} from "./icons";
import { buildFolderTree, type FolderTreeNode } from "./tree";

export interface FolderTreeProps {
  folders: Folder[];
  tabs: SavedTab[];
  windows?: SavedWindow[];
  /** 运行模式：'full' 展示内嵌标签（适合 Popup/Side Panel）；'sidebar' 仅作为目录树导航（适合 Manager 大页左栏） */
  mode?: "full" | "sidebar";
  /** 当前选中的文件夹 ID（支持 null 表示“未分类”，'all' 表示“全部收藏”，'windows' 表示“已收藏窗口”） */
  selectedId?: string | null;
  onSelectFolder?: (folderId: string | null) => void;
  onRestoreTab?: (tab: SavedTab) => void;
  onDeleteTab?: (tab: SavedTab) => void;
  onOpenNotes?: (tab: SavedTab) => void;
  onRestoreWindow?: (win: SavedWindow) => void;
  onDeleteWindow?: (win: SavedWindow) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onRenameFolder?: (folder: Folder) => void;
  onDeleteFolder?: (folder: Folder) => void;
  /** 拖拽标签至文件夹的回调 */
  onDropTabsToFolder?: (tabIds: string[], folderId: string | null) => void;
  /** 拖拽移动文件夹的回调（支持 before / after 排序与 inside 嵌套） */
  onMoveFolder?: (
    sourceFolderId: string,
    targetFolderId: string,
    position: "before" | "after" | "inside",
  ) => void;
}

function TabRow({
  tab,
  depth,
  onRestoreTab,
  onDeleteTab,
  onOpenNotes,
}: {
  tab: SavedTab;
  depth: number;
  onRestoreTab?: (tab: SavedTab) => void;
  onDeleteTab?: (tab: SavedTab) => void;
  onOpenNotes?: (tab: SavedTab) => void;
}) {
  return (
    <div
      className="pagebox-tree-item"
      style={{ paddingLeft: `${16 + depth * 18}px` }}
      onClick={() => onRestoreTab?.(tab)}
    >
      <div className="pagebox-tree-item__chevron-spacer" />
      {tab.favIconUrl ? (
        <img className="pagebox-tree-item__favicon" src={tab.favIconUrl} alt="" />
      ) : (
        <span className="pagebox-tree-item__dot" />
      )}
      <div className="pagebox-tree-item__content">
        <div className="pagebox-tree-item__title">{tab.title}</div>
        <div className="pagebox-tree-item__url">{tab.url}</div>
        {tab.notes && <div className="pagebox-tree-item__notes">{tab.notes}</div>}
      </div>
      <div className="pagebox-tree-item__actions" onClick={(e) => e.stopPropagation()}>
        {onOpenNotes && (
          <button type="button" onClick={() => onOpenNotes(tab)} title="备注">
            备注
          </button>
        )}
        {onDeleteTab && (
          <button type="button" onClick={() => onDeleteTab(tab)} title="删除">
            删除
          </button>
        )}
      </div>
    </div>
  );
}

function WindowRow({
  win,
  depth,
  onRestoreWindow,
  onDeleteWindow,
}: {
  win: SavedWindow;
  depth: number;
  onRestoreWindow?: (win: SavedWindow) => void;
  onDeleteWindow?: (win: SavedWindow) => void;
}) {
  return (
    <div
      className="pagebox-tree-item pagebox-tree-item--window"
      style={{ paddingLeft: `${16 + depth * 18}px` }}
      onClick={() => onRestoreWindow?.(win)}
    >
      <div className="pagebox-tree-item__chevron-spacer" />
      <span className="pagebox-tree-item__win-icon">🪟</span>
      <div className="pagebox-tree-item__content">
        <div className="pagebox-tree-item__title">{win.name}</div>
        <div className="pagebox-tree-item__url">{win.tabs.length} 个标签页</div>
      </div>
      <div className="pagebox-tree-item__actions" onClick={(e) => e.stopPropagation()}>
        {onDeleteWindow && (
          <button type="button" onClick={() => onDeleteWindow(win)} title="删除">
            删除
          </button>
        )}
      </div>
    </div>
  );
}

function FolderNode({
  node,
  depth,
  mode,
  selectedId,
  collapsed,
  onToggle,
  onSelectFolder,
  onRestoreTab,
  onDeleteTab,
  onOpenNotes,
  onRestoreWindow,
  onDeleteWindow,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDropTabsToFolder,
  onMoveFolder,
}: {
  node: FolderTreeNode;
  depth: number;
  mode: "full" | "sidebar";
  selectedId?: string | null;
  collapsed: Set<string>;
  onToggle: (folderId: string) => void;
  onSelectFolder?: (folderId: string | null) => void;
  onRestoreTab?: (tab: SavedTab) => void;
  onDeleteTab?: (tab: SavedTab) => void;
  onOpenNotes?: (tab: SavedTab) => void;
  onRestoreWindow?: (win: SavedWindow) => void;
  onDeleteWindow?: (win: SavedWindow) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onRenameFolder?: (folder: Folder) => void;
  onDeleteFolder?: (folder: Folder) => void;
  onDropTabsToFolder?: (tabIds: string[], folderId: string | null) => void;
  onMoveFolder?: (
    sourceFolderId: string,
    targetFolderId: string,
    position: "before" | "after" | "inside",
  ) => void;
}) {
  const [dropIndicator, setDropIndicator] = useState<"before" | "after" | "inside" | null>(
    null,
  );
  const hasChildren =
    node.children.length > 0 ||
    (mode === "full" && (node.tabs.length > 0 || node.windows.length > 0));
  const isOpen = !collapsed.has(node.folder.id);
  const isSelected = selectedId === node.folder.id;
  const isRoot =
    node.folder.id === "1" || node.folder.id === "2" || node.folder.parentId === null;

  const handleHeaderClick = () => {
    if (mode === "sidebar") {
      onSelectFolder?.(node.folder.id);
    } else {
      if (hasChildren) {
        onToggle(node.folder.id);
      }
    }
  };

  const handleChevronClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggle(node.folder.id);
  };

  return (
    <div className="pagebox-tree-node">
      <div
        className={`pagebox-tree-row ${isSelected ? "is-selected" : ""} ${
          dropIndicator ? `is-drop-${dropIndicator}` : ""
        }`}
        style={{ paddingLeft: `${8 + depth * 18}px` }}
        onClick={handleHeaderClick}
        title={node.folder.name}
        draggable={Boolean(onMoveFolder)}
        onDragStart={(e) => {
          e.dataTransfer.setData("application/pagebox-folder", node.folder.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const isTab = e.dataTransfer.types.includes("application/pagebox-tab");
          if (isTab) {
            setDropIndicator("inside");
            return;
          }
          const isFolder = e.dataTransfer.types.includes("application/pagebox-folder");
          if (isFolder) {
            const rect = e.currentTarget.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const ratio = offsetY / rect.height;
            if (ratio < 0.3) {
              setDropIndicator("before");
            } else if (ratio > 0.7) {
              setDropIndicator("after");
            } else {
              setDropIndicator("inside");
            }
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDropIndicator(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const position = dropIndicator || "inside";
          setDropIndicator(null);
          const tabData = e.dataTransfer.getData("application/pagebox-tab");
          if (tabData) {
            try {
              const parsed = JSON.parse(tabData);
              onDropTabsToFolder?.(Array.isArray(parsed) ? parsed : [parsed], node.folder.id);
            } catch {
              onDropTabsToFolder?.([tabData], node.folder.id);
            }
            return;
          }
          const folderId = e.dataTransfer.getData("application/pagebox-folder");
          if (folderId && folderId !== node.folder.id) {
            onMoveFolder?.(folderId, node.folder.id, position);
          }
        }}
      >
        {/* Chevron 展开箭头或占位对齐 */}
        {hasChildren ? (
          <button
            type="button"
            className="pagebox-tree-chevron"
            onClick={handleChevronClick}
            aria-label={isOpen ? "折叠" : "展开"}
          >
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <div className="pagebox-tree-chevron-placeholder" />
        )}

        {/* Windows 经典黄色文件夹图标 */}
        <span className="pagebox-tree-icon">
          {isOpen && hasChildren ? (
            <FolderOpenYellowIcon size={16} />
          ) : (
            <FolderYellowIcon size={16} />
          )}
        </span>

        {/* 文件夹名称 */}
        <span className="pagebox-tree-name">{node.folder.name}</span>

        {/* 数量标记 */}
        {node.totalItemCount > 0 && (
          <span className="pagebox-tree-count">{node.totalItemCount}</span>
        )}

        {/* 悬停快捷操作（新建子目录、重命名、删除） */}
        <div className="pagebox-tree-hover-actions" onClick={(e) => e.stopPropagation()}>
          {onCreateFolder && (
            <button
              type="button"
              onClick={() => onCreateFolder(node.folder.id)}
              title="新建子文件夹"
            >
              <PlusIcon size={12} />
            </button>
          )}
          {onRenameFolder && !isRoot && (
            <button
              type="button"
              onClick={() => onRenameFolder(node.folder)}
              title="重命名"
            >
              ✎
            </button>
          )}
          {onDeleteFolder && !isRoot && (
            <button
              type="button"
              onClick={() => onDeleteFolder(node.folder)}
              title="删除文件夹"
            >
              <TrashIcon size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 子节点递归渲染 */}
      {isOpen && (
        <div className="pagebox-tree-children">
          {/* 先渲染子文件夹（如 Windows 资源管理器规范） */}
          {node.children.map((child) => (
            <FolderNode
              key={child.folder.id}
              node={child}
              depth={depth + 1}
              mode={mode}
              selectedId={selectedId}
              collapsed={collapsed}
              onToggle={onToggle}
              onSelectFolder={onSelectFolder}
              onRestoreTab={onRestoreTab}
              onDeleteTab={onDeleteTab}
              onOpenNotes={onOpenNotes}
              onRestoreWindow={onRestoreWindow}
              onDeleteWindow={onDeleteWindow}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onDropTabsToFolder={onDropTabsToFolder}
              onMoveFolder={onMoveFolder}
            />
          ))}

          {/* 若为 full 模式，内嵌展示标签和窗口 */}
          {mode === "full" && (
            <>
              {node.windows.map((win) => (
                <WindowRow
                  key={win.id}
                  win={win}
                  depth={depth + 1}
                  onRestoreWindow={onRestoreWindow}
                  onDeleteWindow={onDeleteWindow}
                />
              ))}
              {node.tabs.map((tab) => (
                <TabRow
                  key={tab.id}
                  tab={tab}
                  depth={depth + 1}
                  onRestoreTab={onRestoreTab}
                  onDeleteTab={onDeleteTab}
                  onOpenNotes={onOpenNotes}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  folders,
  tabs,
  windows = [],
  mode = "full",
  selectedId,
  onSelectFolder,
  onRestoreTab,
  onDeleteTab,
  onOpenNotes,
  onRestoreWindow,
  onDeleteWindow,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDropTabsToFolder,
  onMoveFolder,
}: FolderTreeProps) {
  const tree = useMemo(() => buildFolderTree(folders, tabs, windows), [folders, tabs, windows]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [uncatDragOver, setUncatDragOver] = useState(false);

  const toggleFolder = (folderId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const uncategorizedCount = tree.uncategorized.length + tree.uncategorizedWindows.length;

  return (
    <div className={`pagebox-explorer-tree ${mode === "sidebar" ? "is-sidebar" : ""}`}>
      {/* 根节点目录列表 */}
      {tree.roots.map((node) => (
        <FolderNode
          key={node.folder.id}
          node={node}
          depth={0}
          mode={mode}
          selectedId={selectedId}
          collapsed={collapsed}
          onToggle={toggleFolder}
          onSelectFolder={onSelectFolder}
          onRestoreTab={onRestoreTab}
          onDeleteTab={onDeleteTab}
          onOpenNotes={onOpenNotes}
          onRestoreWindow={onRestoreWindow}
          onDeleteWindow={onDeleteWindow}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onDropTabsToFolder={onDropTabsToFolder}
          onMoveFolder={onMoveFolder}
        />
      ))}

      {/* 未分类专区 */}
      {uncategorizedCount > 0 && (
        <div className="pagebox-tree-uncategorized-section">
          <div
            className={`pagebox-tree-row pagebox-tree-row--uncategorized ${
              selectedId === null ? "is-selected" : ""
            } ${uncatDragOver ? "pagebox-tree-row--drop-target" : ""}`}
            style={{ paddingLeft: "8px" }}
            onClick={() => onSelectFolder?.(null)}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUncatDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setUncatDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUncatDragOver(false);
              const tabData = e.dataTransfer.getData("application/pagebox-tab");
              if (tabData) {
                try {
                  const parsed = JSON.parse(tabData);
                  onDropTabsToFolder?.(Array.isArray(parsed) ? parsed : [parsed], null);
                } catch {
                  onDropTabsToFolder?.([tabData], null);
                }
              }
            }}
          >
            <div className="pagebox-tree-chevron-placeholder" />
            <span className="pagebox-tree-icon">📁</span>
            <span className="pagebox-tree-name">未分类</span>
            <span className="pagebox-tree-count">{uncategorizedCount}</span>
          </div>

          {mode === "full" && (
            <div className="pagebox-tree-children">
              {tree.uncategorizedWindows.map((win) => (
                <WindowRow
                  key={win.id}
                  win={win}
                  depth={0}
                  onRestoreWindow={onRestoreWindow}
                  onDeleteWindow={onDeleteWindow}
                />
              ))}
              {tree.uncategorized.map((tab) => (
                <TabRow
                  key={tab.id}
                  tab={tab}
                  depth={0}
                  onRestoreTab={onRestoreTab}
                  onDeleteTab={onDeleteTab}
                  onOpenNotes={onOpenNotes}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
