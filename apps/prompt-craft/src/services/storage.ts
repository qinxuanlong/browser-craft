import { PromptCraftSettings, Skill, SkillCategory } from "../types";
import { PRESET_SKILLS } from "../presets";

const STORAGE_KEY_SKILLS = "promptcraft_skills";
const STORAGE_KEY_SETTINGS = "promptcraft_settings";

export const DEFAULT_SETTINGS: PromptCraftSettings = {
  triggerKey: "/",
  enableFloatingButton: true,
  theme: "auto",
  autoFocusInput: true,
  hotkey: "Alt+P",
};

/**
 * 获取所有本地技能，如果首次运行无数据则自动加载 22 套预置技能
 */
export async function getAllSkills(): Promise<Skill[]> {
  try {
    const res = await chrome.storage.local.get([STORAGE_KEY_SKILLS]);
    const stored = res[STORAGE_KEY_SKILLS];
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }

    // 初始化载入预设
    await chrome.storage.local.set({ [STORAGE_KEY_SKILLS]: PRESET_SKILLS });
    return PRESET_SKILLS;
  } catch (error) {
    console.error("读取 PromptCraft 技能库失败:", error);
    return PRESET_SKILLS;
  }
}

/**
 * 保存或更新单个技能
 */
export async function saveSkill(skill: Skill): Promise<void> {
  const currentSkills = await getAllSkills();
  const index = currentSkills.findIndex((s) => s.id === skill.id);

  let nextSkills: Skill[];
  const now = Date.now();
  const updatedSkill = { ...skill, updatedAt: now };

  if (index >= 0) {
    nextSkills = [...currentSkills];
    nextSkills[index] = updatedSkill;
  } else {
    nextSkills = [updatedSkill, ...currentSkills];
  }

  await chrome.storage.local.set({ [STORAGE_KEY_SKILLS]: nextSkills });
}

/**
 * 删除单个技能
 */
export async function deleteSkill(skillId: string): Promise<void> {
  const currentSkills = await getAllSkills();
  const nextSkills = currentSkills.filter((s) => s.id !== skillId);
  await chrome.storage.local.set({ [STORAGE_KEY_SKILLS]: nextSkills });
}

/**
 * 重置/恢复出厂预置技能
 */
export async function resetToPresets(): Promise<Skill[]> {
  await chrome.storage.local.set({ [STORAGE_KEY_SKILLS]: PRESET_SKILLS });
  return PRESET_SKILLS;
}

/**
 * 批量导入覆盖或增量合并
 */
export async function importSkills(
  newSkills: Skill[],
  mode: "merge" | "override" = "merge"
): Promise<Skill[]> {
  if (mode === "override") {
    await chrome.storage.local.set({ [STORAGE_KEY_SKILLS]: newSkills });
    return newSkills;
  }

  const currentSkills = await getAllSkills();
  const skillMap = new Map<string, Skill>();

  currentSkills.forEach((s) => skillMap.set(s.id, s));
  newSkills.forEach((s) => skillMap.set(s.id, s));

  const merged = Array.from(skillMap.values());
  await chrome.storage.local.set({ [STORAGE_KEY_SKILLS]: merged });
  return merged;
}

/**
 * 获取插件配置
 */
export async function getSettings(): Promise<PromptCraftSettings> {
  try {
    const res = await chrome.storage.local.get([STORAGE_KEY_SETTINGS]);
    return { ...DEFAULT_SETTINGS, ...(res[STORAGE_KEY_SETTINGS] || {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 保存插件配置
 */
export async function saveSettings(
  settings: Partial<PromptCraftSettings>
): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({
    [STORAGE_KEY_SETTINGS]: { ...current, ...settings },
  });
}

/**
 * 搜索与过滤技能
 */
export function filterSkills(
  skills: Skill[],
  query: string,
  category: SkillCategory = "all"
): Skill[] {
  const q = query.trim().toLowerCase();

  return skills.filter((skill) => {
    // 分类过滤
    if (category !== "all" && skill.category !== category) {
      return false;
    }

    // 关键词搜索（支持标题、快捷指令、标签、描述）
    if (!q) return true;

    const matchTitle = skill.title.toLowerCase().includes(q);
    const matchShortcut = skill.shortcut.toLowerCase().includes(q);
    const matchDesc = skill.description.toLowerCase().includes(q);
    const matchTag = skill.tags.some((t) => t.toLowerCase().includes(q));

    return matchTitle || matchShortcut || matchDesc || matchTag;
  });
}
