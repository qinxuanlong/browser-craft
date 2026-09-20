/**
 * PromptCraft (灵感工坊) 核心类型定义
 */

/**
 * 变量类型：单行文本、长文本多行、预设选项单选
 */
export type VariableInputType = "text" | "textarea" | "select";

/**
 * 变量解析对象
 */
export interface SkillVariable {
  key: string; // 占位符唯一键，如 "product"
  label: string; // 界面显示名，如 "产品名称"
  type: VariableInputType;
  options?: string[]; // 当 type 为 select 时的可选项
  defaultValue?: string; // 默认预设值
}

/**
 * 技能分类
 */
export type SkillCategory =
  | "all"
  | "office" // 职场办公
  | "coding" // 编程开发
  | "writing" // 文案创作
  | "learning" // 学术研读
  | "custom"; // 用户自定义

/**
 * 技能 (Skill / Prompt) 数据模型
 */
export interface Skill {
  id: string; // 唯一标识，如 "skill-weekly-report"
  title: string; // 技能名称，如 "周报生成器"
  shortcut: string; // 触发命令，如 "/周报" 或 "/weekly"
  description: string; // 简要功能说明
  category: SkillCategory; // 分类
  tags: string[]; // 检索标签
  template: string; // 提示词正文模板（包含占位符如 {产品}）
  isPreset?: boolean; // 是否为内置预设
  author?: string; // 创作者/作者
  createdAt: number;
  updatedAt: number;
}

/**
 * 用户配置
 */
export interface PromptCraftSettings {
  triggerKey: string; // 斜杠指令触发字符，默认 "/"
  enableFloatingButton: boolean; // 是否在输入框旁显示快捷悬浮胶囊
  theme: "auto" | "light" | "dark";
  autoFocusInput: boolean; // 注入完成后是否自动将光标移回输入框末尾
  hotkey: string; // 全局调色板唤起快捷键，默认 "Alt+P"
}

/**
 * 匹配当前活跃输入框的适配器定义
 */
export interface PlatformAdapter {
  id: string;
  name: string;
  match: (url: string) => boolean;
  findInput: () => HTMLElement | null;
  inject: (el: HTMLElement, text: string) => Promise<boolean>;
}
