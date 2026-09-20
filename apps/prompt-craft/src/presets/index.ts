import { Skill, CategoryItem } from "../types";

/**
 * 默认初始分类（用户可在管理面板中自由增删改查）
 */
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "编程开发", name: "编程开发", icon: "💻", isPreset: true },
  { id: "职场办公", name: "职场办公", icon: "💼", isPreset: true },
  { id: "思维提炼", name: "思维提炼", icon: "🧠", isPreset: true },
];

/**
 * 3 套高质量开箱即用官方展示技能资产
 * 涵盖：代码测试、日常汇报、深度结构化对齐
 */
export const PRESET_SKILLS: Skill[] = [
  // 1. 编程开发：自动化单元测试用例编写
  {
    id: "preset-unit-test",
    title: "自动化单元测试用例编写",
    shortcut: "/unit-test",
    description: "为指定函数编写全覆盖的测试用例，涵盖正常分支、异常抛错与极端边界情况",
    category: "编程开发",
    tags: ["单元测试", "TDD", "质量保障"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名测试驱动开发 (TDD) 践行者。请为我提供的源代码编写覆盖率全面、断言明确的单元测试。

【源代码信息】
- 测试框架: Jest/Vitest
- 待测试的目标代码:
{{待测试的目标代码}}

【编写原则】
1. 包含 **Happy Path**（标准正确流）。
2. 包含 **Edge Cases**（边界值：null、undefined、空字符串、超长值、越界等）。
3. 包含 **Error Path**（预期抛出异常或错误捕获验证）。
4. 代码清晰包含 describe、it/test，且每个用例有简要中文描述意图。`,
  },

  // 2. 职场办公：周报与进展汇报生成
  {
    id: "preset-weekly-report",
    title: "周报与工作进展汇报",
    shortcut: "/周报",
    description: "结构化总结工作亮点、量化业务数据指标、指出风险卡点与下周排期",
    category: "职场办公",
    tags: ["周报", "总结", "工作汇报"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名资深职场效率与管理汇报专家。请根据我提供的工作事项，整理生成一份逻辑严密、量化突出、表达专业的周报总结。

【工作进展信息】
{{工作事项描述}}

【输出规范要求】
1. **本周工作亮点与核心进展**：采用 STAR 原则，优先突出业务价值与量化成果。
2. **风险与协调诉求**：明确卡点阻碍及需要的资源协同。
3. **下周重点规划**：按优先级列出 Top 3 关键行动项与交付时间。
4. 整体排版清晰，使用 Markdown 格式，适当加入直观符号强调重点。`,
  },

  // 3. 思维提炼：深度追问与方案对齐 (grill-me)
  {
    id: "preset-grill-me",
    title: "深度追问与方案对齐 (grill-me)",
    shortcut: "/grill-me",
    description: "通过结构化、单选式提问，澄清模糊需求，并在达成共识前穷尽关键设计决策",
    category: "思维提炼",
    tags: ["深度追问", "需求对齐", "决策分析"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `请扮演一名严谨的架构师兼产品顾问。针对我提出的初步想法或需求，请通过结构化提问帮助我对齐方案并挖掘潜在盲点。

【探讨的主题与初步想法】
{{探讨的主题}}

【提问与推进原则】
1. **单次提问**：每次只提出一个最核心的决策分歧点，不要长篇大论一次抛出多个问题。
2. **提供结构化选项**：给出 2~3 个具体可行的备选方案，并标明 (Recommended) 推荐项与理由。
3. **直击痛点**：优先澄清边界约束、用户体验、性能瓶颈与技术权衡。`,
  },
];
