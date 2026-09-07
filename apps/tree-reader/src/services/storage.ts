import { FileItem, ReaderSettings } from "../types";
import { DEMO_PROJECT } from "./demoProject";

const SETTINGS_KEY = "treereader_settings";
const ACTIVE_FILE_KEY = "treereader_active_file";
const EXPANDED_FOLDERS_KEY = "treereader_expanded_folders";
const CUSTOM_PROJECT_KEY = "treereader_custom_project";

export const DEFAULT_SETTINGS: ReaderSettings = {
  isSidebarCollapsed: false,
  fontSize: 15,
  showLineNumbers: true,
  wordWrap: true,
  theme: "light",
  activeTab: "tree",
  filterCategory: "all",
};

/**
 * 加载用户设置
 */
export async function loadSettings(): Promise<ReaderSettings> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const data = await chrome.storage.local.get(SETTINGS_KEY);
      return { ...DEFAULT_SETTINGS, ...data[SETTINGS_KEY] };
    }
    const local = localStorage.getItem(SETTINGS_KEY);
    return local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 保存用户设置
 */
export async function saveSettings(settings: ReaderSettings): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
      return;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("保存设置失败:", error);
  }
}

/**
 * 加载已展开文件夹集合
 */
export async function loadExpandedFolders(): Promise<string[]> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const data = await chrome.storage.local.get(EXPANDED_FOLDERS_KEY);
      return data[EXPANDED_FOLDERS_KEY] || ["folder-archive"];
    }
    const local = localStorage.getItem(EXPANDED_FOLDERS_KEY);
    return local ? JSON.parse(local) : ["folder-archive"];
  } catch {
    return ["folder-archive"];
  }
}

/**
 * 保存已展开文件夹集合
 */
export async function saveExpandedFolders(ids: string[]): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [EXPANDED_FOLDERS_KEY]: ids });
      return;
    }
    localStorage.setItem(EXPANDED_FOLDERS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error("保存展开文件夹失败:", error);
  }
}

/**
 * 加载当前激活的文件 ID
 */
export async function loadActiveFileId(): Promise<string> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const data = await chrome.storage.local.get(ACTIVE_FILE_KEY);
      return data[ACTIVE_FILE_KEY] || "file-main";
    }
    const local = localStorage.getItem(ACTIVE_FILE_KEY);
    return local || "file-main";
  } catch {
    return "file-main";
  }
}

/**
 * 保存当前激活的文件 ID
 */
export async function saveActiveFileId(id: string): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [ACTIVE_FILE_KEY]: id });
      return;
    }
    localStorage.setItem(ACTIVE_FILE_KEY, id);
  } catch (error) {
    console.error("保存激活文件失败:", error);
  }
}

/**
 * 加载当前挂载的项目
 */
export async function loadCurrentProject(): Promise<FileItem> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const data = await chrome.storage.local.get(CUSTOM_PROJECT_KEY);
      return data[CUSTOM_PROJECT_KEY] || DEMO_PROJECT;
    }
    const local = localStorage.getItem(CUSTOM_PROJECT_KEY);
    return local ? JSON.parse(local) : DEMO_PROJECT;
  } catch {
    return DEMO_PROJECT;
  }
}

/**
 * 保存用户自定义导入的项目
 */
export async function saveCurrentProject(project: FileItem): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [CUSTOM_PROJECT_KEY]: project });
      return;
    }
    localStorage.setItem(CUSTOM_PROJECT_KEY, JSON.stringify(project));
  } catch (error) {
    console.error("保存自定义项目失败:", error);
  }
}
