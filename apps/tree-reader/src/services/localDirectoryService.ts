import { FileItem } from "../types";
import { classifyFile } from "./fileClassifier";

/**
 * 基于标准 HTML5 input webkitdirectory 的目录树构建
 * 核心原则：
 * 1. 纯本地只读，仅在内存中保留文件引用，不上传任何服务器；
 * 2. 不触发浏览器的“是否允许查看和创建副本”权限弹窗；
 * 3. 仅收集目录结构与层级，绝不提前读取正文大文本，毫秒级秒开。
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
 * 按需实时读取指定文件内容（点击时触发，内存只读，不持久化存储）
 */
export async function readFileContent(item: FileItem): Promise<string> {
  // 1. 如果已有内容，直接返回
  if (typeof item.content === "string") {
    return item.content;
  }

  try {
    // 2. 如果存在 rawFile 对象引用，实时读取
    if (item.rawFile) {
      const text = await item.rawFile.text();
      item.content = text; // 仅在当前会话运行时内存中保留
      return text;
    }
  } catch (error) {
    console.error(`读取文件失败: ${item.name}`, error);
    return `[读取文件失败: ${(error as Error).message}]`;
  }

  return "";
}
