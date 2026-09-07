import { ReaderSettings } from "../types";

const SETTINGS_KEY = "treereader_settings";
const ACTIVE_FILE_KEY = "treereader_active_file";
const EXPANDED_FOLDERS_KEY = "treereader_expanded_folders";

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
 * 加载用户界面偏好设置
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
 * 保存用户界面偏好设置
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
