import React, { useRef } from "react";
import { FileItem } from "../../types";
import { UploadIcon } from "../Icons";
import { classifyFile } from "../../services/fileClassifier";

interface ProjectFooterProps {
  project: FileItem;
  onImportProject: (importedProject: FileItem) => void;
  onResetDemo: () => void;
}

export const ProjectFooter: React.FC<ProjectFooterProps> = ({
  project,
  onImportProject,
  onResetDemo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 计算项目下的总文件数
  const countFiles = (item: FileItem): number => {
    if (item.type === "file") return 1;
    if (!item.children) return 0;
    return item.children.reduce((acc, child) => acc + countFiles(child), 0);
  };

  const totalFiles = countFiles(project);

  // 处理本地文件夹或多文件导入
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const rootName = files[0].webkitRelativePath
      ? files[0].webkitRelativePath.split("/")[0]
      : "本地导入项目";

    const newProject: FileItem = {
      id: `imported-${Date.now()}`,
      name: rootName,
      path: "/",
      type: "directory",
      children: [],
    };

    // 递归组织路径
    const dirMap = new Map<string, FileItem>();
    dirMap.set("/", newProject);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath || file.name;
      const parts = relPath.split("/").filter(Boolean);
      const filename = parts[parts.length - 1];

      // 仅读取常见文本和代码
      const { category, language, defaultMode } = classifyFile(filename);
      const content = await file.text();

      // 构建各级文件夹
      let currentPath = "";
      let parent = newProject;

      for (let j = 0; j < parts.length - 1; j++) {
        currentPath += `/${parts[j]}`;
        if (!dirMap.has(currentPath)) {
          const newDir: FileItem = {
            id: `dir-${currentPath}`,
            name: parts[j],
            path: currentPath,
            type: "directory",
            children: [],
          };
          parent.children = parent.children || [];
          parent.children.push(newDir);
          dirMap.set(currentPath, newDir);
        }
        parent = dirMap.get(currentPath)!;
      }

      // 添加文件项
      const fileItem: FileItem = {
        id: `file-${relPath}-${Date.now()}-${i}`,
        name: filename,
        path: `/${relPath}`,
        type: "file",
        extension: filename.split(".").pop() || "",
        category,
        language,
        content,
        size: file.size,
      };

      parent.children = parent.children || [];
      parent.children.push(fileItem);
    }

    onImportProject(newProject);

    // 清空 input 避免无法重复选择相同目录
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="project-footer-container">
      {/* 隐藏的文件夹/文件选取 input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory 是原生支持属性
        webkitdirectory=""
        style={{ display: "none" }}
        onChange={handleFileChange}
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
          onClick={() => fileInputRef.current?.click()}
          title="选取本地文件夹导入"
        >
          <UploadIcon size={13} />
          <span>导入文件夹</span>
        </button>

        <button
          type="button"
          className="footer-btn reset-btn"
          onClick={onResetDemo}
          title="切换回示范小说与代码项目"
        >
          恢复示例
        </button>
      </div>
    </div>
  );
};
