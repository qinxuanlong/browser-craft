import React, { useRef } from "react";
import { FileItem } from "../../types";
import { FolderOpenIcon } from "../Icons";
import {
  openDirectoryViaNativePicker,
  buildDirectoryFromFileList,
} from "../../services/localDirectoryService";

interface ProjectFooterProps {
  project: FileItem;
  isDemo: boolean;
  onDirectoryOpened: (newProject: FileItem) => void;
  onSwitchToDemo: () => void;
}

export const ProjectFooter: React.FC<ProjectFooterProps> = ({
  project,
  isDemo,
  onDirectoryOpened,
  onSwitchToDemo,
}) => {
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  // 统计目录下总文件数
  const countFiles = (item: FileItem): number => {
    if (item.type === "file") return 1;
    if (!item.children) return 0;
    return item.children.reduce((acc, child) => acc + countFiles(child), 0);
  };

  const totalFiles = countFiles(project);

  // 打开本地文件夹（优先使用原生 showDirectoryPicker，降级使用 webkitdirectory）
  const handleOpenDirectory = async () => {
    // 1. 尝试原生对话框
    const result = await openDirectoryViaNativePicker();
    if (result) {
      onDirectoryOpened(result);
      return;
    }

    // 2. 降级通过 input 选择
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
          title="选择并浏览本地电脑中的文件夹（纯本地只读，不上传不存储）"
        >
          <FolderOpenIcon size={13} />
          <span>{isDemo ? "打开本地文件夹" : "切换本地文件夹"}</span>
        </button>

        {!isDemo && (
          <button
            type="button"
            className="footer-btn reset-btn"
            onClick={onSwitchToDemo}
            title="切换回示范小说与代码项目"
          >
            示例小说
          </button>
        )}
      </div>
    </div>
  );
};
