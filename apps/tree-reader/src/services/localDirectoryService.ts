import { FileItem } from "../types";
import { classifyFile } from "./fileClassifier";

/**
 * 检查当前运行环境是否支持现代 File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/**
 * 通过现代浏览器 File System Access API 打开本地文件夹（支持读写与外部同步）
 */
export async function openDirectoryWithPicker(): Promise<FileItem | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error("当前浏览器环境不支持 File System Access API");
  }

  try {
    const dirHandle = await (window as unknown as {
      showDirectoryPicker: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker({
      mode: "readwrite",
    });

    return await buildDirectoryFromHandle(dirHandle);
  } catch (error) {
    // 用户主动取消弹窗属于正常行为，返回 null
    if ((error as Error).name === "AbortError") {
      return null;
    }
    console.error("打开本地文件夹失败:", error);
    throw error;
  }
}

/**
 * 基于 FileSystemDirectoryHandle 递归构建目录树
 * 核心优化：只遍历节点基本元数据，不提前读取正文大文本，万级文件秒开
 */
export async function buildDirectoryFromHandle(
  dirHandle: FileSystemDirectoryHandle,
  parentPath = ""
): Promise<FileItem> {
  const currentPath = parentPath ? `${parentPath}/${dirHandle.name}` : `/${dirHandle.name}`;

  const rootItem: FileItem = {
    id: `dir-${currentPath}`,
    name: dirHandle.name,
    path: currentPath,
    type: "directory",
    dirHandle,
    children: [],
  };

  const subDirs: FileItem[] = [];
  const files: FileItem[] = [];

  // 异步迭代遍历目录项
  // @ts-expect-error FileSystemDirectoryHandle.values async iterator
  for await (const entry of dirHandle.values()) {
    const itemPath = `${currentPath}/${entry.name}`;

    if (entry.kind === "directory") {
      const childDir = await buildDirectoryFromHandle(
        entry as FileSystemDirectoryHandle,
        currentPath
      );
      subDirs.push(childDir);
    } else if (entry.kind === "file") {
      const fileHandle = entry as FileSystemFileHandle;
      const { category, language } = classifyFile(entry.name);

      const fileItem: FileItem = {
        id: `file-${itemPath}`,
        name: entry.name,
        path: itemPath,
        type: "file",
        extension: entry.name.split(".").pop() || "",
        category,
        language,
        fileHandle,
      };

      files.push(fileItem);
    }
  }

  // 排序规范：文件夹优先按拼音/字母排序，文件随后排序
  subDirs.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  files.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  rootItem.children = [...subDirs, ...files];
  return rootItem;
}

/**
 * 基于标准 HTML5 input webkitdirectory 的目录树构建（降级兼容方案）
 */
export function buildDirectoryFromFileList(files: FileList): FileItem {
  const isSingleFile = files.length === 1 && !files[0].webkitRelativePath;
  const rootName = files[0]?.webkitRelativePath
    ? files[0].webkitRelativePath.split("/")[0]
    : isSingleFile
    ? files[0].name
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
      lastModified: file.lastModified,
    };

    parent.children = parent.children || [];
    parent.children.push(fileItem);
  }

  return rootProject;
}

/**
 * 基于单个 FileSystemFileHandle 构建单文件项目（支持原生读写与外部感知）
 */
export async function buildSingleFileProjectFromHandle(
  fileHandle: FileSystemFileHandle
): Promise<FileItem> {
  const file = await fileHandle.getFile();
  const { category, language } = classifyFile(file.name);

  const fileItem: FileItem = {
    id: `file-single-${Date.now()}`,
    name: file.name,
    path: `/${file.name}`,
    type: "file",
    extension: file.name.split(".").pop() || "",
    category,
    language,
    size: file.size,
    lastModified: file.lastModified,
    fileHandle,
  };

  return {
    id: `dir-single-${Date.now()}`,
    name: file.name,
    path: `/${file.name}`,
    type: "directory",
    children: [fileItem],
  };
}

/**
 * 基于内存/缓存文本数据构建单文件项目（用于从 file:/// Content Script 传递来的文本）
 */
export function buildSingleFileProjectFromData(data: {
  id?: string;
  name: string;
  path?: string;
  content: string;
  size?: number;
  lastModified?: number;
}): FileItem {
  const classification = classifyFile(data.name);
  const fileItem: FileItem = {
    id: data.id || `file-local-${Date.now()}`,
    name: data.name,
    path: data.path || `/${data.name}`,
    type: "file",
    extension: data.name.split(".").pop() || "",
    category: classification.category,
    language: classification.language,
    content: data.content,
    size: data.size ?? data.content.length,
    lastModified: data.lastModified ?? Date.now(),
  };

  return {
    id: `dir-single-${Date.now()}`,
    name: data.name,
    path: data.path || `/${data.name}`,
    type: "directory",
    children: [fileItem],
  };
}

/**
 * 按需实时读取指定文件内容
 * @param item 文件项
 * @param forceReload 是否强制绕过内存缓存重新读取物理磁盘
 */
export async function readFileContent(
  item: FileItem,
  forceReload = false
): Promise<string> {
  // 1. 如果已有内容且未要求强制刷新，直接返回缓存
  if (!forceReload && typeof item.content === "string") {
    return item.content;
  }

  try {
    // 2. 现代 FileSystemFileHandle 句柄读取（支持读写同步与外部感知）
    if (item.fileHandle) {
      const file = await item.fileHandle.getFile();
      const text = await file.text();
      item.content = text;
      item.lastModified = file.lastModified;
      item.size = file.size;
      return text;
    }

    // 3. 降级兼容：通过 rawFile 只读读取
    if (item.rawFile) {
      const text = await item.rawFile.text();
      item.content = text;
      item.lastModified = item.rawFile.lastModified;
      return text;
    }
  } catch (error) {
    console.error(`读取文件失败: ${item.name}`, error);
    return `[读取文件失败: ${(error as Error).message}]`;
  }

  return "";
}

/**
 * 将修改后的内容直接持久化写入本地物理磁盘
 * @param item 文件项
 * @param newContent 待保存文本
 */
export async function saveFileContent(
  item: FileItem,
  newContent: string
): Promise<boolean> {
  if (!item.fileHandle) {
    throw new Error("当前文件未获得本地写入授权（可能通过只读降级模式打开）");
  }

  try {
    // 获取写入流并覆盖写入
    const writable = await item.fileHandle.createWritable();
    await writable.write(newContent);
    await writable.close();

    // 写入成功后更新内存中内容与时间戳
    item.content = newContent;
    try {
      const updatedFile = await item.fileHandle.getFile();
      item.lastModified = updatedFile.lastModified;
      item.size = updatedFile.size;
    } catch {
      item.lastModified = Date.now();
    }

    return true;
  } catch (error) {
    console.error(`写入文件失败: ${item.name}`, error);
    throw error;
  }
}

/**
 * 检查磁盘物理文件是否已被外部工具修改
 * @param item 文件项
 */
export async function checkFileModified(item: FileItem): Promise<boolean> {
  if (!item.fileHandle || !item.lastModified) {
    return false;
  }

  try {
    const file = await item.fileHandle.getFile();
    // 存在至少 10ms 差异视为外部更新（过滤自身保存微秒抖动）
    if (file.lastModified > item.lastModified + 10) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
