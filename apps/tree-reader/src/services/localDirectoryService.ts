import { FileItem } from "../types";
import { classifyFile } from "./fileClassifier";

/**
 * 原生 File System Access API 方式：选择并扫描本地文件夹
 * 核心原则：只收集目录结构与句柄，绝不提前读取文件正文，绝不写入任何存储！
 */
export async function openDirectoryViaNativePicker(): Promise<FileItem | null> {
  // 检查浏览器是否支持 showDirectoryPicker
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
    return null;
  }

  try {
    // 弹出原生系统选择文件夹对话框
    // @ts-expect-error window.showDirectoryPicker
    const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      mode: "read",
    });

    const rootItem: FileItem = {
      id: `dir-${dirHandle.name}`,
      name: dirHandle.name,
      path: `/${dirHandle.name}`,
      type: "directory",
      children: [],
    };

    // 递归读取目录树（仅收集句柄与元数据，极速毫秒级完成，不读内容）
    async function scanDirectory(
      currentHandle: FileSystemDirectoryHandle,
      parentItem: FileItem,
      currentPath: string
    ) {
      for await (const [name, entry] of (currentHandle as any).entries()) {
        const itemPath = `${currentPath}/${name}`;

        if (entry.kind === "directory") {
          const subDir: FileItem = {
            id: `dir-${itemPath}`,
            name,
            path: itemPath,
            type: "directory",
            children: [],
          };
          parentItem.children = parentItem.children || [];
          parentItem.children.push(subDir);
          await scanDirectory(entry, subDir, itemPath);
        } else if (entry.kind === "file") {
          const { category, language } = classifyFile(name);
          const ext = name.split(".").pop() || "";

          const fileItem: FileItem = {
            id: `file-${itemPath}`,
            name,
            path: itemPath,
            type: "file",
            extension: ext,
            category,
            language,
            fileHandle: entry, // 仅保存句柄引用，点击时按需实时读取
          };

          parentItem.children = parentItem.children || [];
          parentItem.children.push(fileItem);
        }
      }
    }

    await scanDirectory(dirHandle, rootItem, `/${dirHandle.name}`);
    return rootItem;
  } catch (error) {
    // 用户取消或拒绝权限
    if ((error as Error).name === "AbortError") {
      return null;
    }
    console.error("打开本地目录失败:", error);
    return null;
  }
}

/**
 * 降级方案：基于 input webkitdirectory 文件的目录树构建
 * 核心原则：只保留 File 对象在内存中的引用，绝不提前读取正文内容！
 */
export function buildDirectoryFromFileList(files: FileList): FileItem {
  const rootName = files[0]?.webkitRelativePath
    ? files[0].webkitRelativePath.split("/")[0]
    : "本地目录";

  const rootProject: FileItem = {
    id: `dir-root-${Date.now()}`,
    name: rootName,
    path: `/${rootName}`,
    type: "directory",
    children: [],
  };

  const dirMap = new Map<string, FileItem>();
  dirMap.set(`/${rootName}`, rootProject);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split("/").filter(Boolean);
    const filename = parts[parts.length - 1];

    const { category, language } = classifyFile(filename);

    let currentPath = `/${parts[0]}`;
    let parent = rootProject;

    for (let j = 1; j < parts.length - 1; j++) {
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

    // 仅保存 rawFile 内存引用，绝不执行 file.text()
    const fileItem: FileItem = {
      id: `file-${relPath}-${i}`,
      name: filename,
      path: `/${relPath}`,
      type: "file",
      extension: filename.split(".").pop() || "",
      category,
      language,
      size: file.size,
      rawFile: file,
    };

    parent.children = parent.children || [];
    parent.children.push(fileItem);
  }

  return rootProject;
}

/**
 * 按需实时读取指定文件内容（点击时触发，不存储）
 */
export async function readFileContent(item: FileItem): Promise<string> {
  // 1. 如果已有内容（如内置示例），直接返回
  if (typeof item.content === "string") {
    return item.content;
  }

  try {
    // 2. 如果存在现代 FileSystemFileHandle 句柄，实时从磁盘读取
    if (item.fileHandle) {
      const file = await item.fileHandle.getFile();
      const text = await file.text();
      item.content = text; // 仅在当前会话运行时内存中保留
      return text;
    }

    // 3. 如果存在 rawFile 对象引用，实时读取
    if (item.rawFile) {
      const text = await item.rawFile.text();
      item.content = text;
      return text;
    }
  } catch (error) {
    console.error(`读取文件失败: ${item.name}`, error);
    return `[读取文件失败: ${(error as Error).message}]`;
  }

  return "";
}
