import React, { useState } from "react";

interface PromptBuilderModalProps {
  onApply: (template: string, title?: string, shortcut?: string, description?: string) => void;
  onClose: () => void;
}

export const PromptBuilderModal: React.FC<PromptBuilderModalProps> = ({
  onApply,
  onClose,
}) => {
  const [role, setRole] = useState("资深专家与行业导师");
  const [background, setBackground] = useState("我正在推进一项核心业务，需要高质量的专业建议与交付物。");
  const [task, setTask] = useState("对提供的原始输入进行全面梳理、提炼并输出执行方案。");
  const [variablesText, setVariablesText] = useState("核心内容:textarea, 风格调性:专业严谨|通俗易懂, 语言=中文");
  const [constraints, setConstraints] = useState("结论先行，逻辑严密，过滤无效寒暄，优先使用数据与要点证明。");
  const [outputFormat, setOutputFormat] = useState("使用 Markdown 格式排版，包含关键摘要、结构化分析表格与行动清单。");

  const handleGenerate = () => {
    // 组装格式化变量列表
    const parsedVarTokens = variablesText
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `{${item}}`);

    const varLines = parsedVarTokens.map((token) => `- 输入项：${token}`).join("\n");

    const fullTemplate = `你是一名【${role}】。

【背景与情境】
${background}

【核心任务】
${task}

【输入参数】
${varLines}

【约束规范与执行原则】
${constraints}

【期望输出格式】
${outputFormat}`;

    onApply(fullTemplate, `${role.slice(0, 6)}助理`, `/${role.slice(0, 4)}`, task.slice(0, 25));
    onClose();
  };

  return (
    <div className="promptcraft-editor-overlay">
      <div className="promptcraft-builder-modal">
        <div className="editor-header">
          <div className="editor-title">🪄 结构化 Prompt 构建向导 (Prompt Builder)</div>
          <button type="button" className="editor-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="builder-body">
          <p className="builder-intro">
            依据工业级 Prompt 工程学最佳实践（角色设定 + 背景情境 + 核心任务 + 动态变量 + 约束条件 + 输出结构），引导您轻松生成高质量专业指令。
          </p>

          <div className="builder-grid">
            <div className="builder-field">
              <label>1. 专家角色定位 (Role) *</label>
              <input
                type="text"
                placeholder="例如：麦肯锡商业咨询总监、资深架构师"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <div className="builder-field">
              <label>2. 业务背景与上下文 (Context) *</label>
              <input
                type="text"
                placeholder="例如：当前团队正在准备 Q3 战役汇报，领导时间极其有限"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </div>

            <div className="builder-field full-width">
              <label>3. 核心执行任务 (Task) *</label>
              <textarea
                rows={2}
                placeholder="例如：分析所给产品方案的优劣势，提炼差异化破局策略"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
            </div>

            <div className="builder-field full-width">
              <label>
                4. 动态填报变量 (支持 :textarea 多行、:选项1|选项2 下拉、=默认值)
              </label>
              <input
                type="text"
                placeholder="例如：原始素材:textarea, 语气:专业|亲和, 语言=中文"
                value={variablesText}
                onChange={(e) => setVariablesText(e.target.value)}
              />
            </div>

            <div className="builder-field">
              <label>5. 约束与避免 (Constraints) *</label>
              <textarea
                rows={2}
                placeholder="例如：禁止使用空话套话，不要道歉，严禁主观臆断"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
              />
            </div>

            <div className="builder-field">
              <label>6. 输出结构与格式 (Format) *</label>
              <textarea
                rows={2}
                placeholder="例如：采用 Markdown 表格形式呈现对比，每点必须包含数据支撑"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-submit" onClick={handleGenerate}>
            一键组装并装填至编辑器 ➔
          </button>
        </div>
      </div>
    </div>
  );
};
