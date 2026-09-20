import React, { useEffect, useRef, useState } from "react";
import { Skill, SkillVariable } from "../types";
import { extractVariables, renderTemplate } from "../services/variableParser";

interface VariableModalProps {
  skill: Skill;
  onConfirm: (renderedText: string) => void;
  onCancel: () => void;
}

export const VariableModal: React.FC<VariableModalProps> = ({
  skill,
  onConfirm,
  onCancel,
}) => {
  const [variables, setVariables] = useState<SkillVariable[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // 初始化变量与默认值
  useEffect(() => {
    const vars = extractVariables(skill.template);
    setVariables(vars);

    const initialValues: Record<string, string> = {};
    vars.forEach((v) => {
      initialValues[v.key] = v.defaultValue || "";
    });
    setFormValues(initialValues);

    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 60);
  }, [skill]);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    const rendered = renderTemplate(skill.template, formValues);
    onConfirm(rendered);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Esc 取消
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }

    // Cmd+Enter 或 Ctrl+Enter 提交，或在普通单行 input 上回车提交
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  const renderedPreview = renderTemplate(skill.template, formValues);

  return (
    <div className="promptcraft-overlay" onClick={onCancel} onKeyDown={handleKeyDown}>
      <div
        className="promptcraft-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="promptcraft-modal-header">
          <div className="promptcraft-modal-title-wrap">
            <span className="promptcraft-modal-icon">✨</span>
            <div>
              <div className="promptcraft-modal-title">{skill.title}</div>
              <div className="promptcraft-modal-sub">{skill.description}</div>
            </div>
          </div>
          <button className="promptcraft-close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="promptcraft-modal-body">
          <div className="promptcraft-form-list">
            {variables.map((variable, index) => {
              const isFirst = index === 0;
              return (
                <div key={variable.key} className="promptcraft-form-field">
                  <label className="promptcraft-field-label">
                    <span>{variable.label}</span>
                    {variable.defaultValue && (
                      <span className="promptcraft-default-badge">
                        默认: {variable.defaultValue}
                      </span>
                    )}
                  </label>

                  {variable.type === "textarea" ? (
                    <textarea
                      ref={isFirst ? (firstInputRef as React.RefObject<HTMLTextAreaElement>) : undefined}
                      className="promptcraft-textarea"
                      rows={3}
                      placeholder={`请输入${variable.label}... (Ctrl/Cmd+Enter 提交)`}
                      value={formValues[variable.key] || ""}
                      onChange={(e) => handleChange(variable.key, e.target.value)}
                    />
                  ) : variable.type === "select" ? (
                    <select
                      className="promptcraft-select"
                      value={formValues[variable.key] || ""}
                      onChange={(e) => handleChange(variable.key, e.target.value)}
                    >
                      {variable.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      ref={isFirst ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
                      type="text"
                      className="promptcraft-input"
                      placeholder={`请输入${variable.label}... (回车可直接提交)`}
                      value={formValues[variable.key] || ""}
                      onChange={(e) => handleChange(variable.key, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleConfirm();
                        }
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 实时预览切换器 */}
          <div className="promptcraft-preview-toggle">
            <button
              type="button"
              className="promptcraft-preview-btn"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "▼ 收起合成预览" : "▶ 查看合成后的完整 Prompt 预览"}
            </button>
          </div>

          {showPreview && (
            <div className="promptcraft-preview-box">
              <pre>{renderedPreview}</pre>
            </div>
          )}
        </div>

        <div className="promptcraft-modal-footer">
          <button className="promptcraft-btn-secondary" onClick={onCancel}>
            取消 (Esc)
          </button>
          <button className="promptcraft-btn-primary" onClick={handleConfirm}>
            注入聊天框 ↵
          </button>
        </div>
      </div>
    </div>
  );
};
