import { CategoryItem, PromptCraftSettings, Skill, SkillCategory } from "../types";
import { DEFAULT_CATEGORIES, PRESET_SKILLS } from "../presets";

const STORAGE_KEY_SKILLS = "promptcraft_skills";
const STORAGE_KEY_CATEGORIES = "promptcraft_categories";
const STORAGE_KEY_SETTINGS = "promptcraft_settings";
const STORAGE_KEY_PRESET_VERSION = "promptcraft_preset_version_v3";

export const DEFAULT_SETTINGS: PromptCraftSettings = {
  triggerKey: "/",
  enableFloatingButton: true,
  theme: "auto",
  autoFocusInput: true,
  hotkey: "Alt+P",
};

/**
 * 获取所有本地技能，自动升级为精简的 3 套展示预设，并保留用户所有自定义资产
 */
export async function getAllSkills(): Promise<Skill[]> {
  try {
    const res = await chrome.storage.local.get([
      STORAGE_KEY_SKILLS,
      STORAGE_KEY_PRESET_VERSION,
    ]);
    const stored = res[STORAGE_KEY_SKILLS];
    const version = res[STORAGE_KEY_PRESET_VERSION];

    // 如果版本未升级到 v3，自动将冗余的 22 套预设替换为 3 套展示预设，同时保留用户自创资产
    if (version !== 3 && Array.isArray(stored)) {
      const userCustomSkills = stored.filter((s: Skill) => !s.isPreset);
      const migratedSkills = [...PRESET_SKILLS, ...userCustomSkills];
      await chrome.storage.local.set({
        [STORAGE_KEY_SKILLS]: migratedSkills,
        [STORAGE_KEY_PRESET_VERSION]: 3,
      });
      return migratedSkills;
    }

    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }

    // 首次载入预设
    await chrome.storage.local.set({
      [STORAGE_KEY_SKILLS]: PRESET_SKILLS,
      [STORAGE_KEY_PRESET_VERSION]: 3,
    });
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

  // 如果技能包含新分类，自动注册到分类列表
  if (skill.category && skill.category !== "all") {
    await ensureCategoryExists(skill.category);
  }
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
 * 重置/恢复出厂预置技能（3 套展示预设）及默认分类
 */
export async function resetToPresets(): Promise<Skill[]> {
  await chrome.storage.local.set({
    [STORAGE_KEY_SKILLS]: PRESET_SKILLS,
    [STORAGE_KEY_CATEGORIES]: DEFAULT_CATEGORIES,
    [STORAGE_KEY_PRESET_VERSION]: 3,
  });
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
 * 获取所有分类（支持用户自主新建、编辑、删除）
 */
export async function getAllCategories(): Promise<CategoryItem[]> {
  try {
    const res = await chrome.storage.local.get([STORAGE_KEY_CATEGORIES]);
    const stored = res[STORAGE_KEY_CATEGORIES];
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }

    await chrome.storage.local.set({ [STORAGE_KEY_CATEGORIES]: DEFAULT_CATEGORIES });
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

/**
 * 新建或保存自定义分类
 */
export async function saveCategory(categoryName: string, icon = "📁"): Promise<CategoryItem[]> {
  const trimmed = categoryName.trim();
  if (!trimmed) return await getAllCategories();

  const current = await getAllCategories();
  const exists = current.find((c) => c.name === trimmed || c.id === trimmed);
  if (exists) {
    return current;
  }

  const newCategory: CategoryItem = {
    id: trimmed,
    name: trimmed,
    icon,
    isPreset: false,
  };

  const next = [...current, newCategory];
  await chrome.storage.local.set({ [STORAGE_KEY_CATEGORIES]: next });
  return next;
}

/**
 * 确保分类存在（当保存新技能且指定了新分类时）
 */
export async function ensureCategoryExists(categoryName: string): Promise<void> {
  const trimmed = categoryName.trim();
  if (!trimmed || trimmed === "all") return;
  const current = await getAllCategories();
  if (!current.some((c) => c.name === trimmed || c.id === trimmed)) {
    const next = [...current, { id: trimmed, name: trimmed, icon: "📁", isPreset: false }];
    await chrome.storage.local.set({ [STORAGE_KEY_CATEGORIES]: next });
  }
}

/**
 * 删除用户自定义分类
 */
export async function deleteCategory(categoryId: string): Promise<CategoryItem[]> {
  const current = await getAllCategories();
  const next = current.filter((c) => c.id !== categoryId && c.name !== categoryId);
  await chrome.storage.local.set({ [STORAGE_KEY_CATEGORIES]: next });
  return next;
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
    // 分类过滤：匹配分类 id 或 name
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
