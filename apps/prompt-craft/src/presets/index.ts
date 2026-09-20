import { Skill } from "../types";

/**
 * 22 套工业级开箱即用高质量 Skill / Prompt 预置资产库
 * 覆盖：职场办公、编程开发、文案创作、学术研读 4 大高频场景
 */
export const PRESET_SKILLS: Skill[] = [
  // ================= 职场办公 (Office) =================
  {
    id: "preset-weekly-report",
    title: "周报与进展汇报生成",
    shortcut: "/周报",
    description: "结构化总结本周工作亮点、量化关键业务数据、指出卡点风险与下周计划",
    category: "office",
    tags: ["周报", "总结", "工作汇报"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名资深职场效率与管理汇报专家。请根据我提供的碎片化工作事项，整理生成一份逻辑严密、量化突出、表达专业的周报总结。

【输入信息】
- 本周核心工作：{本周工作:textarea}
- 关键成果与数据指标：{量化数据}
- 遇到的难点或待协调事项：{风险难点=无特殊卡点}
- 下周工作推进计划：{下周计划:textarea}
- 输出语气：{语气:专业严谨|简洁有力|热情饱满}

【输出规范要求】
1. **本周工作亮点与进展**：采用 STAR 原则（情境/任务/行动/结果），优先使用数据呈现业务价值。
2. **风险与协调诉求**：明确阻碍点及需要哪位角色支持（若无则直接标明稳步推进）。
3. **下周重点规划**：按优先级列出 Top 3 关键事项与交付预期。
4. 整体排版清晰，使用 Markdown 格式，适当加入直观符号强调重点。`,
  },
  {
    id: "preset-meeting-minutes",
    title: "会议纪要精炼与行动项",
    shortcut: "/会议纪要",
    description: "将口语化会议记录或语音转写文本提炼为共识决定与责任人行动项（Action Items）",
    category: "office",
    tags: ["会议", "纪要", "行动项"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名高效敏捷的项目管理经理。请将以下会议记录内容提炼为专业、清晰、可直接向参会人员发送的《会议纪要与行动清单》。

【会议信息】
- 会议主题：{会议主题}
- 原始讨论记录：{讨论记录:textarea}
- 参会对象：{参会人=相关项目成员}

【输出规范】
1. **一句话背景与会议目标**。
2. **核心讨论与达成共识**（分条要点列出，过滤废话）。
3. **行动项清单 (Action Items)**：以 Markdown 表格输出，包含【任务序号 | 具体行动项 | 责任人 | 截止时间】。
4. **遗留问题或下次对齐点**。`,
  },
  {
    id: "preset-upward-report",
    title: "向上汇报与决策请求",
    shortcut: "/向上汇报",
    description: "按照结论先行、三点支撑的 SCQA 架构，向高层领导高效汇报进展并请求决策",
    category: "office",
    tags: ["向上管理", "领导汇报", "决策请求"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `请扮演一名精通金字塔原理与麦肯锡沟通架构的职业顾问。我需要向领导汇报一项重要事项并请求决策支持，请帮我组织汇报文案。

【事项背景】
- 汇报主题：{汇报主题}
- 现状与突发情况：{现状描述:textarea}
- 我们提供的备选方案：{方案对比:textarea}
- 希望领导协助拍板或支持的资源：{诉求资源}

【组织结构规范】
- **结论先行 (TL;DR)**：首句说明核心诉求与推荐方案。
- **情境与挑战 (Situation & Complication)**：简洁清晰陈述背景。
- **方案对比与权衡**：列出 Option A 与 Option B 的利弊和投入产出比。
- **明确行动请求 (Next Step)**：明确需要领导拍板的具体点，让领导只需回复“同意/选A”。`,
  },
  {
    id: "preset-business-email",
    title: "专业商务邮件撰写与润色",
    shortcut: "/商务邮件",
    description: "撰写跨团队协作、合作伙伴沟通或客户维系的高情商商务邮件",
    category: "office",
    tags: ["邮件", "职场沟通", "商务交流"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `请帮我撰写一封得体、专业且逻辑清晰的商务沟通邮件。

【邮件意图】
- 收件人身份：{收件人身份:外部合作客户|跨部门同事|公司高管}
- 核心目的：{核心目的}
- 详细背景或关键内容：{关键内容:textarea}
- 语言语种：{语言:中文|英文}
- 风格调性：{调性:礼貌委婉|严谨高效|坚定推进}

请分别提供：
1. 吸引人且明确的【邮件主题行 (Subject)】（提供 2 个候选）。
2. 【邮件正文】：问候语、事由陈述、核心信息、截止时间/下一步行动、致谢签署。`,
  },
  {
    id: "preset-okr-framework",
    title: "OKR 制定与量化对齐",
    shortcut: "/okr",
    description: "将业务战略目标拆解为野心勃勃的 Objective 与可验证的 Key Results",
    category: "office",
    tags: ["目标管理", "战略规划", "绩效"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名硅谷顶尖的 OKR 教练。请根据我当前团队的业务目标，梳理并产出一套符合 SMART 原则、具有挑战性且可度量的 OKR 体系。

【业务现状】
- 所属部门/产品线：{部门或产品}
- 期望达成的核心愿景：{愿景目标:textarea}
- 考核周期：{周期:季度Q1-Q4|半年度|年度}

请输出：
1. **目标 Objective (O)**：具有激励性、定性描述、方向明确。
2. **关键结果 Key Results (KR 1~3)**：必须包含基线、具体指标数字与时间节点（例如“从 X 提升到 Y”）。
3. **关键行动抓手 (Initiatives)**：支撑每个 KR 的核心推进动作。`,
  },
  {
    id: "preset-competitor-analysis",
    title: "竞品深度对比分析",
    shortcut: "/竞品分析",
    description: "从商业模式、核心功能、用户体验与差异化优势多维度深度解构竞争对手",
    category: "office",
    tags: ["产品分析", "竞品调研", "市场洞察"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `作为一名资深商业分析师与产品总监，请帮我对【{我方产品}】与竞品【{竞争对手}】进行深度对比分析。

【行业赛道】：{行业领域}
【主要关注维度】：{关注重点:产品功能|商业模式|用户体验|技术壁垒}
【已知背景细节】：{补充信息:textarea}

请按以下维度出具调研报告：
1. **核心定位与目标客群画像对比**。
2. **关键功能与用户体验差异**（以表格罗列强弱势）。
3. **商业化与盈利机制差异**。
4. **我方的破局机会与差异化破局策略 (SWOT/战术建议)**。`,
  },

  // ================= 编程开发 (Coding) =================
  {
    id: "preset-code-review",
    title: "代码审查与重构建议 (Code Review)",
    shortcut: "/cr",
    description: "从安全性、性能、可维护性与规范性深度审查代码，提供优化前后对比",
    category: "coding",
    tags: ["代码评审", "重构", "优化", "安全"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名经验丰富的资深架构师和技术专家。请对以下代码进行严格的 Code Review。

【待评审代码与语言】
- 编程语言：{语言:TypeScript|JavaScript|Python|Go|Rust|Java|C++}
- 代码片段：
\`\`\`
{代码片段:textarea}
\`\`\`
- 重点关注方向：{审查偏好:性能与复杂度|内存安全与并发|架构拓展性|全方位审查}

【审查输出结构】
1. **整体评价**（一两句话给出整体质量定级：优秀/良好/存在隐患）。
2. **潜在缺陷与安全隐患**（包括竞态条件、内存泄漏、未处理异常、边缘边界漏洞）。
3. **性能与坏味道 (Code Smell)**。
4. **优化重构方案**：给出重构后的完整代码块，并附带改动原因注释。`,
  },
  {
    id: "preset-git-commit",
    title: "Git 规范提交信息生成",
    shortcut: "/git-commit",
    description: "根据修改说明或 git diff 快速生成遵循 Conventional Commits 规范的清晰提交信息",
    category: "coding",
    tags: ["Git", "版本管理", "开发规范"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名崇尚工程规范的开源项目维护者。请根据我提供的代码变更描述或 git diff，生成符合 **Conventional Commits 规范**的标准 Git 提交信息。

【变更内容】
- 变更描述或 diff 片段：{改动说明:textarea}
- 涉及模块/作用域：{模块名=核心模块}

【输出要求】
1. 主类型严格限定为：\`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`perf\`, \`test\`, \`chore\`。
2. 首行格式：\`<type>(<scope>): <清晰中文简述>\`（不超过 50 字）。
3. 详细正文：若变更较多，使用要点列出具体改动与原因。
4. 提供 2 组最佳选项供我直接复制。`,
  },
  {
    id: "preset-bug-debug",
    title: "BUG 深度排查与根因分析",
    shortcut: "/debug",
    description: "输入报错堆栈与复现步骤，推演根本原因并给出修复补丁与防御性编程建议",
    category: "coding",
    tags: ["调试", "排错", "根因定位"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名专精系统底层与疑难杂症排查的首席排错专家。我遇到了一个 Bug，请帮我分析原因并提供解决方案。

【错误上下文】
- 技术栈与运行环境：{技术栈}
- 报错信息/堆栈日志：
\`\`\`
{报错日志:textarea}
\`\`\`
- 复现步骤或问题发生时的代码逻辑：
\`\`\`
{相关逻辑代码:textarea}
\`\`\`

【分析推演输出】
1. **根本原因定位 (Root Cause Analysis)**：用通俗透彻的语言解释为什么会抛出该错误。
2. **即刻修复代码 (Fix)**：给出精确的修复补丁代码（标明修改行）。
3. **防御性编程建议**：未来如何避免同类隐患再次发生（如增加校验、单元测试断言等）。`,
  },
  {
    id: "preset-tech-architecture",
    title: "系统技术方案与架构设计",
    shortcut: "/arch",
    description: "梳理高并发、高可用业务系统的技术选型、分层架构、数据流与容灾方案",
    category: "coding",
    tags: ["架构设计", "方案设计", "系统高可用"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名大型互联网企业的基础架构架构师。请针对我提出的业务需求，出具一份高可用、易扩展的《技术架构设计方案》。

【需求概况】
- 业务需求描述：{需求说明:textarea}
- 预估并发与数据量级：{量级规模=中等规模(QPS 1000+)}
- 限制条件或技术栈偏好：{技术栈约束}

请按如下章节出具方案：
1. **系统整体分层架构设计**（接入层、网关层、应用层、数据层）。
2. **关键技术选型与理由**（存储数据库、缓存、消息队列等）。
3. **核心业务数据流转流程**。
4. **数据模型设计**（核心表与关键字段草案）。
5. **高可用、安全性与容灾考虑**（限流熔断、读写分离、鉴权防刷）。`,
  },
  {
    id: "preset-api-documentation",
    title: "RESTful API 规范文档生成",
    shortcut: "/api-doc",
    description: "依据接口功能或已有结构体，生成符合 OpenAPI 规范的高质量中文 Markdown 接口文档",
    category: "coding",
    tags: ["接口文档", "API", "前后端联调"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `请根据以下接口需求，编写一份符合现代 RESTful 设计标准、可供前后端高效联调的 API 文档。

【接口需求】
- 接口名称：{接口名称}
- 业务逻辑功能：{功能简述:textarea}
- 请求方式与路径草案：{请求方法与路径=POST /api/v1/resource}

【文档输出规范】
- **接口基本信息**：URL、Method、Content-Type、权限认证方式。
- **请求参数**：包含 Query / Path / Body 参数，用 Markdown 表格说明【参数名 | 类型 | 是否必填 | 默认值 | 说明】。
- **请求示例 (JSON Payload)**。
- **响应参数说明与成功响应示例 (HTTP 200)**。
- **常见业务错误码 (Error Codes)**：列出 HTTP 400/401/403/500 及自定义 Code 说明。`,
  },
  {
    id: "preset-unit-tests",
    title: "自动化单元测试用例编写",
    shortcut: "/unit-test",
    description: "为指定函数编写全覆盖的测试用例，涵盖正常分支、异常抛错与极端边界情况",
    category: "coding",
    tags: ["单元测试", "TDD", "质量保障"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名测试驱动开发 (TDD) 践行者。请为我提供的源代码编写覆盖率全面、断言明确的单元测试。

【源代码信息】
- 测试框架：{测试框架:Jest/Vitest|PyTest|Go Test|JUnit 5}
- 待测试的目标代码：
\`\`\`
{目标代码:textarea}
\`\`\`

【编写原则】
1. 包含 **Happy Path**（标准正确流）。
2. 包含 **Edge Cases**（边界值：null、undefined、空字符串、超长值、越界等）。
3. 包含 **Error Path**（预期抛出异常或错误捕获验证）。
4. 代码清晰包含 \`describe\`, \`it\`/\`test\`，且每个用例有简要中文描述意图。`,
  },

  // ================= 文案创作 (Writing) =================
  {
    id: "preset-xiaohongshu-post",
    title: "小红书爆款文案生成器",
    shortcut: "/小红书",
    description: "吸睛爆款标题 + 情绪共鸣正文 + 表情符号排版 + 热门高搜标签",
    category: "writing",
    tags: ["自媒体", "文案", "社交媒体", "爆款"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名拥有百万粉丝的小红书资深操盘手。请根据我的主题，创作一篇极具点击率和收藏欲的小红书爆款图文笔记文案。

【笔记主题】
- 分享的主题/产品/技能：{主题名称}
- 目标受众群体：{受众画像=年轻职场人/学生党}
- 核心亮点与痛点解决：{核心亮点:textarea}
- 语气风格：{风格:闺蜜真诚种草|干货导师指路|清醒犀利吐槽}

【小红书爆款法则要求】
1. **爆款标题库**：提供 5 个抓人眼球的标题（包含：数字化对比、制造信息差、情绪唤醒、痛点反击）。
2. **正文排版**：
   - 黄金前三行（直击痛点，拒绝废话开头）。
   - 中间段落分段短小（每段 1~2 句话），善用 Emoji（如✨💡🔥📌）点缀。
   - 结尾设置互动钩子，激发评论区讨论与点赞收藏。
3. **精选标签 Tags**：生成 5~8 个高曝光相关话题标签。`,
  },
  {
    id: "preset-wechat-article",
    title: "公众号深度结构化长文",
    shortcut: "/公众号",
    description: "起承转合的故事引入、金句穿插、观点升华与深度行文排版",
    category: "writing",
    tags: ["长文", "深度写作", "公众号"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名资深深度报道记者与新媒体主编。请根据以下构想，撰写一篇具有深度思考、情感张力与传播价值的深度微信公众号文章。

【选题信息】
- 文章选题：{文章选题}
- 想要表达的核心观点：{核心论点:textarea}
- 预设参考案例或素材：{案例素材:textarea}
- 篇幅偏好：{篇幅:1500字精炼版|2500字深度长文}

【文章架构规范】
1. **引子**：用一个极具代入感的现实场景或微观故事破题。
2. **现象剖析**：剥离表面，剖析背后的底层逻辑或认知误区。
3. **观点破局**：提出独到见解，提供反直觉但可落地的解法。
4. **金句收尾**：穿插 2~3 句值得读者截图分享的金句，引发价值升华。`,
  },
  {
    id: "preset-short-video-script",
    title: "短视频分镜头带货/口播脚本",
    shortcut: "/分镜头",
    description: "黄金前 3 秒钩子 + 视觉画面分镜 + 节奏口播台词 + 情绪唤起与行动呼吁",
    category: "writing",
    tags: ["短视频", "脚本", "分镜头", "口播"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名短视频百万爆款内容编导。请为我创作一份节奏明快、完播率高的短视频分镜头脚本。

【脚本信息】
- 视频主题或推广内容：{视频主题}
- 视频时长：{时长:30秒极速完播|60秒干货口播|90秒剧情反转}
- 核心卖点或反转点：{卖点或转折:textarea}

【输出格式：分镜头表格】
请以 Markdown 表格输出以下列：
【镜头编号 | 预估时长 | 景别与画面运镜描述 | 口播台词与文案 | 背景音乐/音效指示】

特别强化：
- **前 3 秒黄金钩子**：必须立刻抓住注意力阻止用户划走。
- **痛点共鸣与解决方案演示**。
- **尾声强效行动呼吁 (Call to Action)**。`,
  },
  {
    id: "preset-polished-translate",
    title: "多语言信达雅翻译与本地化润色",
    shortcut: "/翻译",
    description: "告别生硬机翻，深度理解文化语境，兼顾直译与意译的文学级/商务级翻译",
    category: "writing",
    tags: ["翻译", "本地化", "双语润色"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名联合国同传译员与双语文学翻译家。请帮我翻译以下文本，确保精准传递原意，行文优雅地道。

【源文本信息】
- 目标语言：{目标语言:英语|中文|日语|德语|法语}
- 应用场景：{语境:商务正式|地道口语|学术学术|科技软文}
- 待翻译文本：
\`\`\`
{待翻译原文:textarea}
\`\`\`

【输出格式】
1. **信达雅精译版本**：地道纯正，符合母语者阅读习惯。
2. **直译参考版本**：紧贴原文句型结构。
3. **重点词汇与地道表达拆解**：指出 2~3 处精妙翻译技巧或文化背景说明。`,
  },

  // ================= 学术研读 (Learning) =================
  {
    id: "preset-paper-dissect",
    title: "学术论文与行业研报四步拆解",
    shortcut: "/论文拆解",
    description: "按照研究问题、核心方法、实验结果与局限性四大支柱，极速掌握前沿文献",
    category: "learning",
    tags: ["论文阅读", "文献综述", "研报分析"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名顶会审稿专家与学术研读者。请对以下论文或研报的摘要/正文内容进行专业、客观的结构化拆解。

【论文或研报内容】
- 论文标题/领域：{论文名称或领域}
- 摘要或正文节选：
\`\`\`
{论文内容:textarea}
\`\`\`

请按学术研读金标准输出：
1. **研究动机 (Research Question)**：作者到底试图解决什么未被妥善处理的痛点？
2. **核心方法与创新点 (Methodology & Novelty)**：采用了哪些核心技术或模型构架？与前人相比区别在哪？
3. **核心实验结论与量化指标 (Key Findings)**：实验验证了什么？关键指标提升了多少？
4. **局限性与批判性思考 (Limitations & Critique)**：该方法在哪些场景下可能失效？未来有何改进空间？`,
  },
  {
    id: "preset-feynman-technique",
    title: "费曼学习法：以通俗比喻讲解复杂概念",
    shortcut: "/费曼学习",
    description: "把高深晦涩的专业名词、数学算法或前沿概念，用小学生都能懂的生活化比喻讲透",
    category: "learning",
    tags: ["费曼技巧", "概念普及", "深度学习"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `请化身为物理学家理查德·费曼。我正在学习一个复杂深奥的新概念，请用费曼学习法的精髓为我深入浅出地讲解。

【目标概念】
- 复杂名词/定理/技术概念：{待学概念}
- 我的理解水平：{当前认知:完全小白零基础|有一定理科常识|希望掌握底层原理}

【讲解四步骤】
1. **一句话生活化本质类比**：用日常生活常见场景或童话故事作比喻（绝不堆砌任何黑话）。
2. **核心原理通俗拆解**：拆成 3 个关键要素一步步推演。
3. **典型应用实例**：在现实生活中或实际工程里它是怎么发挥作用的？
4. **自我检测思考题**：提出一个简单问题来帮我自测是否真的理解了。`,
  },
  {
    id: "preset-core-extractor",
    title: "长文核心论点与论据快速萃取",
    shortcut: "/核心提炼",
    description: "过滤长篇文章中的冗余铺垫，快速提取核心主张、论据事实与行动启示",
    category: "learning",
    tags: ["速读", "信息提炼", "知识管理"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你是一名高效知识管理专家。请帮助我脱水萃取以下长文的核心精髓，帮我节省 90% 的阅读时间。

【原始长文本】
\`\`\`
{长文内容:textarea}
\`\`\`

【萃取清单】
1. **一句话核心主张 (TL;DR)**：作者最核心想要说服读者的观点。
2. **核心支撑论据 (3~5条)**：区分作者给出的【客观事实/数据】与【主观推论】。
3. **关键金句摘抄 (Key Quotes)**。
4. **给读者的落地行动启示**。`,
  },
  {
    id: "preset-devils-advocate",
    title: "魔鬼代言人：批判性质疑与反方视角",
    shortcut: "/反方视角",
    description: "扮演反方角色对既定观点或商业决策发起猛烈质疑，寻找逻辑漏洞与盲区",
    category: "learning",
    tags: ["批判性思维", "反思", "决策盲区"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `你现在是一名冷酷、敏锐的“魔鬼代言人 (Devil's Advocate)”。你的任务不是顺合我的想法，而是全力以赴寻找我逻辑中的盲区、偏见和潜在破绽。

【我的观点/计划决策】
\`\`\`
{我的想法或方案:textarea}
\`\`\`

请从以下几个残酷视角对我进行拷问与抨击：
1. **隐含的前提假设漏洞**：有哪些我认为理所当然的前提其实很脆弱？
2. **最可能导致失败的墨菲定律情境**：在最坏情况下，事情会如何崩盘？
3. **被忽视的隐性成本与利益受损方**。
4. **对立观点的最强有力论据**。
5. **如何针对上述反驳建立防御壁垒**。`,
  },
  {
    id: "preset-mental-models",
    title: "查理·芒格思维模型映射分析",
    shortcut: "/思维模型",
    description: "套用第一性原理、逆向思维、二阶效应、复利效应等经典思维模型深度解析现实难题",
    category: "learning",
    tags: ["认知提升", "芒格", "思维模型"],
    isPreset: true,
    author: "PromptCraft",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    template: `请化身为智慧老人查理·芒格，运用跨学科多元思维模型格栅，帮助我剖析眼前面对的复杂问题。

【现实困惑】
- 遇到的决策或难题：{现实困惑:textarea}

请分别调用以下经典思维模型出具思考报告：
1. **第一性原理 (First Principles)**：剥离所有类比和过往经验，这件事最底层的物理不可违背事实是什么？
2. **逆向思维 (Inversion)**：“如果想把这件事彻底搞砸，需要怎么做？”然后反向规避。
3. **二阶与多阶效应 (Second-Order Thinking)**：当下决定的长远连锁反应是什么？
4. **机会成本与杠杆解 (Opportunity Cost & Leverage)**：当前资源投入的最优杠杆点在哪里？`,
  },
];
