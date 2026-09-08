import React, { useRef } from "react";
import { FileItem } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
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
  const { t } = useTranslation();
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

  const displayProjectName =
    project && (project.name === "本地目录" || project.name === "Local Directory")
      ? t.footer.defaultDirectoryName
      : project?.name || "";

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
            <div className="project-title-text" title={displayProjectName}>
              📁 {displayProjectName}
            </div>
            <div className="project-count-badge">{t.footer.totalFiles(totalFiles)}</div>
          </div>

          <div className="project-action-buttons">
            <button
              type="button"
              className="footer-btn import-btn"
              onClick={handleOpenDirectory}
              title={t.footer.changeFolderTitle}
            >
              <FolderOpenIcon size={13} />
              <span>{t.footer.changeFolder}</span>
            </button>

            {onRefreshDirectory && (
              <button
                type="button"
                className="footer-btn refresh-btn"
                onClick={onRefreshDirectory}
                disabled={isRefreshing}
                title={t.footer.refreshTitle}
              >
                <RefreshIcon size={13} className={isRefreshing ? "spin-icon" : ""} />
                <span>{isRefreshing ? t.footer.refreshing : t.footer.refresh}</span>
              </button>
            )}

            {onCloseDirectory && (
              <button
                type="button"
                className="footer-btn reset-btn"
                onClick={onCloseDirectory}
                title={t.footer.closeTitle}
              >
                {t.footer.close}
              </button>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          className="footer-btn import-btn full-btn"
          onClick={handleOpenDirectory}
          title={t.footer.openFolderTitle}
        >
          <FolderOpenIcon size={14} />
          <span>{t.footer.openFolder}</span>
        </button>
      )}
    </div>
  );
};
