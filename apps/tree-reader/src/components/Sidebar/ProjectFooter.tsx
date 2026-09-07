import React, { useRef } from "react";
import { FileItem } from "../../types";
import { FolderOpenIcon } from "../Icons";
import {
  openDirectoryViaNativePicker,
  buildDirectoryFromFileList,
} from "../../services/localDirectoryService";

interface ProjectFooterProps {
  project: FileItem | null;
  onDirectoryOpened: (newProject: FileItem) => void;
  onCloseDirectory?: () => void;
}

export const ProjectFooter: React.FC<ProjectFooterProps> = ({
  project,
  onDirectoryOpened,
  onCloseDirectory,
}) => {
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  // 统计目录下总文件数
  const countFiles = (item: FileItem): number => {
    if (item.type === "file") return 1;
    if (!item.children) return 0;
    return item.children.reduce((acc, child) => acc + countFiles(child), 0);
  };

  const totalFiles = project ? countFiles(project) : 0;

  // 打开本地文件夹（优先使用原生 showDirectoryPicker，降级使用 webkitdirectory）
  const handleOpenDirectory = async () => {
    const result = await openDirectoryViaNativePicker();
    if (result) {
      onDirectoryOpened(result);
      return;
    }
    fallbackInputRef.current?.click();
  };

  const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const rootProject = buildDirectoryFromFileList(files);
    onDirectoryOpened(rootProject);

    if (fallbackInputRef.current) {
      fallbackInputRef.current.value = "";
    }
  };

  return (
    <div className="project-footer-container">
      {/* 隐藏的降级选择 input */}
      <input
        ref={fallbackInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory 原生属性
        webkitdirectory=""
        style={{ display: "none" }}
        onChange={handleFallbackChange}
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
