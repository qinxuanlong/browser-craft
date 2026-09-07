import React from "react";
import { FileItem, FilterCategory } from "../../types";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  MarkdownIcon,
  CodeIcon,
  TextIcon,
} from "../Icons";

interface FileTreeProps {
  project: FileItem | null;
  activeFileId: string;
  expandedFolders: Set<string>;
  filterCategory: FilterCategory;
  searchQuery: string;
  isListView?: boolean;
  onSelectFile: (file: FileItem) => void;
  onToggleFolder: (folderId: string) => void;
  onOpenDirectory?: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  project,
  activeFileId,
  expandedFolders,
  filterCategory,
  searchQuery,
  isListView = false,
  onSelectFile,
  onToggleFolder,
  onOpenDirectory,
}) => {
  // 获取文件专属图标
  const renderFileIcon = (file: FileItem) => {
    if (file.category === "markdown" || file.extension === "md") {
      return <MarkdownIcon size={15} />;
    }
    if (file.category === "code") {
      const ext = file.extension?.toUpperCase() || "<>";
      return <CodeIcon size={14} label={ext === "JSON" ? "{}" : ext.slice(0, 2)} />;
    }
    return <TextIcon size={14} />;
  };

  // 格式过滤判定
  const matchesFilter = (item: FileItem): boolean => {
    if (filterCategory === "all") return true;
    if (item.type === "directory") return true;
    return item.category === filterCategory;
  };

  // 搜索匹配判定
  const matchesSearch = (item: FileItem): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(q);
    const contentMatch = item.content?.toLowerCase().includes(q) || false;
    return nameMatch || contentMatch;
  };

  // 收集所有平铺文件（用于列表视图）
  const getAllFiles = (item: FileItem | null): FileItem[] => {
    if (!item) return [];
    let files: FileItem[] = [];
    if (item.type === "file") {
      if (matchesFilter(item) && matchesSearch(item)) {
        files.push(item);
      }
    } else if (item.children) {
      item.children.forEach((child) => {
        files = files.concat(getAllFiles(child));
      });
    }
    return files;
  };

  // 如果没有打开任何项目
  if (!project) {
    return (
      <div className="file-tree-empty-welcome">
        <div className="empty-tree-icon">📂</div>
        <div className="empty-tree-title">未打开任何本地目录</div>
        <div className="empty-tree-desc">选择一个本地小说、文档或代码文件夹直接只读查看</div>
        {onOpenDirectory && (
          <button
            type="button"
            className="empty-open-btn"
            onClick={onOpenDirectory}
          >
            打开本地文件夹
          </button>
        )}
      </div>
    );
  }

  // 渲染平铺列表视图
  if (isListView) {
    const allFiles = getAllFiles(project);
    if (allFiles.length === 0) {
      return <div className="tree-empty-tip">未找到匹配的文件</div>;
    }
    return (
      <div className="file-list-flat">
        {allFiles.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              className={`file-node-row ${isActive ? "active" : ""}`}
              onClick={() => onSelectFile(file)}
            >
              <span className="file-type-icon">{renderFileIcon(file)}</span>
              <span className="file-name-text" title={file.path}>
                {file.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // 递归树节点渲染
  const renderNode = (node: FileItem, depth: number = 0): React.ReactNode => {
    // 目录节点
    if (node.type === "directory") {
      const isExpanded = expandedFolders.has(node.id);
      const visibleChildren = (node.children || []).filter((child) => {
        if (child.type === "directory") return true;
        return matchesFilter(child) && matchesSearch(child);
      });

      // 如果有子节点或为空目录
      return (
        <div key={node.id} className="tree-directory-group">
          <div
            className="tree-node-row directory-row"
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            onClick={() => onToggleFolder(node.id)}
          >
            <span className="tree-arrow-icon">
              {isExpanded ? <ChevronDownIcon size={13} /> : <ChevronRightIcon size={13} />}
            </span>
            <span className="folder-icon-wrapper">
              {isExpanded ? <FolderOpenIcon size={15} /> : <FolderIcon size={15} />}
            </span>
            <span className="folder-name-text">{node.name}</span>
          </div>

          {isExpanded && visibleChildren.length > 0 && (
            <div className="tree-children-container">
              {visibleChildren.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // 文件节点
    if (!matchesFilter(node) || !matchesSearch(node)) {
      return null;
    }

    const isActive = node.id === activeFileId;

    return (
      <div
        key={node.id}
        className={`tree-node-row file-row ${isActive ? "active" : ""}`}
        style={{ paddingLeft: `${depth * 14 + 18}px` }}
        onClick={() => onSelectFile(node)}
      >
        <span className="file-type-icon">{renderFileIcon(node)}</span>
        <span className="file-name-text">{node.name}</span>
      </div>
    );
  };

  const topLevelChildren = (project.children || []).filter((child) => {
    if (child.type === "directory") return true;
    return matchesFilter(child) && matchesSearch(child);
  });

  return (
    <div className="file-tree-container">
      {topLevelChildren.length > 0 ? (
        topLevelChildren.map((child) => renderNode(child, 0))
      ) : (
        <div className="tree-empty-tip">目录为空或未匹配到文件</div>
      )}
    </div>
  );
};
