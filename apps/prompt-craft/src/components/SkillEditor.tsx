import React, { useState } from "react";
import { Skill, SkillCategory } from "../types";
import { extractVariables } from "../services/variableParser";

interface SkillEditorProps {
  initialSkill?: Skill | null;
  onSave: (skill: Skill) => void;
  onCancel: () => void;
  onOpenBuilder: () => void;
}

export const SkillEditor: React.FC<SkillEditorProps> = ({
  initialSkill,
  onSave,
  onCancel,
  onOpenBuilder,
}) => {
  const [title, setTitle] = useState(initialSkill?.title || "");
  const [shortcut, setShortcut] = useState(initialSkill?.shortcut || "/");
  const [category, setCategory] = useState<SkillCategory>(
    initialSkill?.category || "office"
  );
  const [description, setDescription] = useState(initialSkill?.description || "");
  const [tagsStr, setTagsStr] = useState((initialSkill?.tags || []).join(", "));
  const [template, setTemplate] = useState(initialSkill?.template || "");

  // 实时解析模板中的变量
  const detectedVariables = extractVariables(template);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("请填写技能名称");
      return;
    }
    if (!template.trim()) {
      alert("请填写提示词模板正文");
      return;
    }

    let finalShortcut = shortcut.trim();
    if (!finalShortcut.startsWith("/")) {
      finalShortcut = `/${finalShortcut}`;
    }

    const tags = tagsStr
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const savedSkill: Skill = {
      id: initialSkill?.id || `skill-${Date.now()}`,
      title: title.trim(),
      shortcut: finalShortcut,
      category,
      description: description.trim(),
      tags: tags.length > 0 ? tags : ["通用"],
      template,
      isPreset: initialSkill?.isPreset || false,
      createdAt: initialSkill?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(savedSkill);
  };

  const insertVariableSample = (varSyntax: string) => {
    setTemplate((prev) => prev + varSyntax);
  };

  return (
    <div className="promptcraft-editor-overlay">
      <div className="promptcraft-editor-modal">
        <div className="editor-header">
          <div className="editor-title">
            {initialSkill ? "编辑技能资产" : "新建提示词技能 (Skill)"}
          </div>
          <div className="editor-actions-top">
            <button
              type="button"
              className="editor-builder-btn"
              onClick={onOpenBuilder}
            >
              🪄 结构化 Prompt 构建向导
            </button>
            <button type="button" className="editor-close-btn" onClick={onCancel}>
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="editor-form">
          <div className="editor-form-row">
            <div className="form-group flex-2">
              <label>技能名称 *</label>
              <input
                type="text"
                placeholder="例如：周报生成器、代码评审专家"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label>触发指令 (Shortcut) *</label>
              <input
                type="text"
                placeholder="/周报 或 /cr"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label>所属分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SkillCategory)}
              >
                <option value="office">💼 职场办公</option>
                <option value="coding">💻 编程开发</option>
                <option value="writing">✍️ 文案创作</option>
                <option value="learning">📚 学术研读</option>
                <option value="custom">🛠️ 自定义</option>
              </select>
            </div>
          </div>

          <div className="editor-form-row">
            <div className="form-group flex-2">
              <label>简短功能描述</label>
              <input
                type="text"
                placeholder="例如：结构化梳理本周成果与下周计划，产出 Markdown 表格"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group flex-1">
              <label>标签 (逗号隔开)</label>
              <input
                type="text"
                placeholder="总结, 汇报, 周报"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
              />
            </div>
          </div>

          {/* 模板正文 */}
          <div className="form-group flex-1">
            <div className="template-label-row">
              <label>提示词模板正文 (支持 Markdown 与变量占位符) *</label>
              <div className="var-shortcuts">
                <span>快速插入占位符：</span>
                <button
                  type="button"
                  onClick={() => insertVariableSample("{内容}")}
                  title="普通单行文本输入"
                >
                  + 单行文本
                </button>
                <button
                  type="button"
                  onClick={() => insertVariableSample("{详情:textarea}")}
                  title="多行大文本域"
                >
                  + 多行文本
                </button>
                <button
                  type="button"
                  onClick={() => insertVariableSample("{语气:专业|轻松|严肃}")}
                  title="下拉可选项"
                >
                  + 下拉选项
                </button>
                <button
                  type="button"
                  onClick={() => insertVariableSample("{语言=中文}")}
                  title="带默认值"
                >
                  + 默认值
                </button>
              </div>
            </div>

            <textarea
              className="editor-textarea"
              rows={12}
              placeholder="编写你的提示词模板。例如：&#10;你是一名资深专家。请根据以下信息撰写汇报：&#10;- 本周事项：{本周事项:textarea}&#10;- 风格调性：{风格:专业严谨|简洁有力}&#10;- 语言：{语言=中文}"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              required
            />
          </div>

          {/* 实时变量感知徽章 */}
          <div className="detected-variables-bar">
            <span className="detected-title">
              💡 实时检测到的变量 ({detectedVariables.length} 个)：
            </span>
            {detectedVariables.length === 0 ? (
              <span className="no-var-hint">当前模板无变量（选择时将毫秒级一键直接注入）</span>
            ) : (
              detectedVariables.map((v) => (
                <span key={v.key} className="var-chip">
                  <span className="chip-key">{v.key}</span>
                  <span className="chip-type">({v.type})</span>
                  {v.defaultValue && (
                    <span className="chip-def">={v.defaultValue}</span>
                  )}
                </span>
              ))
            )}
          </div>

          <div className="editor-footer">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn-submit">
              保存技能资产
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
