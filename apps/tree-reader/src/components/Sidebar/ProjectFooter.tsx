import React, { useRef } from "react";
import { FileItem } from "../../types";
import { FolderOpenIcon, RefreshIcon } from "../Icons";
import {
  buildDirectoryFromFileList,
  openDirectoryWithPicker,
  isFileSystemAccessSupported,
} from "../../services/localDirectoryService";

interface ProjectFooterProps {
  project: FileItem | null;
  isRefreshing?: boolean;
  onDirectoryOpened: (newProject: FileItem) => void;
  onCloseDirectory?: () => void;
  onRefreshDirectory?: () => void;
}

export const ProjectFooter: React.FC<ProjectFooterProps> = ({
  project,
  isRefreshing = false,
  onDirectoryOpened,
  onCloseDirectory,
  onRefreshDirectory,
}) => {
  const folderInputRef = useRef<HTMLInputElement>(null);

  // 统计目录下总文件数
  const countFiles = (item: FileItem): number => {
    if (item.type === "file") return 1;
    if (!item.children) return 0;
    return item.children.reduce((acc, child) => acc + countFiles(child), 0);
  };

  const totalFiles = project ? countFiles(project) : 0;

  // 打开本地文件夹（优先采用现代 File System Access API 授权读写，降级采用 input webkitdirectory）
  const handleOpenDirectory = async () => {
    if (isFileSystemAccessSupported()) {
      try {
        const rootProject = await openDirectoryWithPicker();
        if (rootProject) {
          onDirectoryOpened(rootProject);
          return;
        }
        return;
      } catch (err) {
        console.warn("现代文件选择器唤起失败，降级为原生文件输入", err);
      }
    }

    folderInputRef.current?.click();
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const rootProject = buildDirectoryFromFileList(files);
    onDirectoryOpened(rootProject);

    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  return (
    <div className="project-footer-container">
      {/* 原生系统标准文件夹选择器（零弹窗、零复制、纯只读） */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory 原生属性
        webkitdirectory=""
        style={{ display: "none" }}
        onChange={handleFolderChange}
      />

      {project ? (
        <>
          <div className="project-info-row">
            <div className="project-title-text" title={project.name}>
              📁 {project.name}
            </div>
            <div className="project-count-badge">共 {totalFiles} 个文件</div>
          </div>

          <div className="project-action-buttons">
            <button
              type="button"
              className="footer-btn import-btn"
              onClick={handleOpenDirectory}
              title="切换其他本地文件夹"
            >
              <FolderOpenIcon size={13} />
              <span>切换文件夹</span>
            </button>

            {onRefreshDirectory && (
              <button
                type="button"
                className="footer-btn refresh-btn"
                onClick={onRefreshDirectory}
                disabled={isRefreshing}
                title="重新扫描并同步本地磁盘目录"
              >
                <RefreshIcon size={13} className={isRefreshing ? "spin-icon" : ""} />
                <span>{isRefreshing ? "刷新中" : "刷新"}</span>
              </button>
            )}

            {onCloseDirectory && (
              <button
                type="button"
                className="footer-btn reset-btn"
                onClick={onCloseDirectory}
                title="关闭当前目录"
              >
                关闭
              </button>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          className="footer-btn import-btn full-btn"
          onClick={handleOpenDirectory}
          title="选择并浏览本地电脑中的文件夹"
        >
          <FolderOpenIcon size={14} />
          <span>打开本地文件夹</span>
        </button>
      )}
    </div>
  );
};
