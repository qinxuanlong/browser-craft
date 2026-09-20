import { Skill, SkillCategory } from "../types";

/**
 * 将单个 Skill 导出为符合标准 YAML Frontmatter 的 Markdown 文本
 */
export function skillToMarkdown(skill: Skill): string {
  const frontmatter = [
    "---",
    `id: ${skill.id}`,
    `title: ${skill.title}`,
    `shortcut: ${skill.shortcut}`,
    `category: ${skill.category}`,
    `tags: [${skill.tags.join(", ")}]`,
    `description: ${skill.description.replace(/\n/g, " ")}`,
    `author: ${skill.author || "User"}`,
    `updatedAt: ${skill.updatedAt}`,
    "---",
    "",
    skill.template,
  ].join("\n");

  return frontmatter;
}

/**
 * 将带有 Frontmatter 的 Markdown 文本解析为 Skill 对象
 */
export function markdownToSkill(content: string, fallbackId?: string): Skill | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("---")) {
    // 纯文本 Markdown，尝试从前两行推测标题和快捷指令
    const lines = trimmed.split("\n");
    const firstLine = lines[0].replace(/^#*\s*/, "").trim() || "未命名技能";
    return {
      id: fallbackId || `skill-${Date.now()}`,
      title: firstLine,
      shortcut: `/${firstLine.slice(0, 4)}`,
      description: "通过 Markdown 导入的技能",
      category: "custom",
      tags: ["导入"],
      template: trimmed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // 包含 YAML Frontmatter
  const parts = trimmed.split("---");
  if (parts.length < 3) return null;

  const yamlBlock = parts[1];
  const templateBody = parts.slice(2).join("---").trim();

  const metadata: Record<string, string> = {};
  yamlBlock.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim();
      metadata[key] = val;
    }
  });

  const title = metadata.title || "导入技能";
  const shortcut = metadata.shortcut || `/${title.slice(0, 4)}`;
  const category = (metadata.category as SkillCategory) || "custom";

  let tags: string[] = [];
  if (metadata.tags) {
    tags = metadata.tags
      .replace(/[\[\]]/g, "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return {
    id: metadata.id || fallbackId || `skill-${Date.now()}`,
    title,
    shortcut: shortcut.startsWith("/") ? shortcut : `/${shortcut}`,
    description: metadata.description || "无描述",
    category,
    tags: tags.length > 0 ? tags : ["通用"],
    template: templateBody,
    author: metadata.author || "User",
    createdAt: metadata.createdAt ? Number(metadata.createdAt) : Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * 批量导出为统一 JSON 备份文件
 */
export function exportSkillsToJson(skills: Skill[]): string {
  return JSON.stringify(
    {
      version: "1.0",
      generator: "PromptCraft",
      exportedAt: new Date().toISOString(),
      skills,
    },
    null,
    2
  );
}

/**
 * 解析导入的 JSON 备份包
 */
export function parseSkillsFromJson(jsonStr: string): Skill[] {
  try {
    const data = JSON.parse(jsonStr);
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data.skills)) {
      return data.skills;
    }
    return [];
  } catch (err) {
    console.error("解析 JSON 技能包失败:", err);
    return [];
  }
}
