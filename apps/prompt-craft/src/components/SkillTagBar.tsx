import React, { useState } from "react";
import { Skill } from "../types";

interface SkillTagBarProps {
  skills: Skill[];
  onRemove: (skillId: string) => void;
  targetRect: DOMRect | null;
}

export const SkillTagBar: React.FC<SkillTagBarProps> = ({
  skills,
  onRemove,
  targetRect,
}) => {
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);

  if (!skills || skills.length === 0 || !targetRect) {
    return null;
  }

  // 计算胶囊栏定位：贴合在输入框上方（留出足够呼吸感）
  const barTop = Math.max(8, targetRect.top - 36);
  const barLeft = Math.max(8, targetRect.left + 6);
  const maxWidth = Math.max(200, targetRect.width - 20);

  return (
    <div
      className="promptcraft-tag-bar-container"
      style={{
        position: "fixed",
        top: `${barTop}px`,
        left: `${barLeft}px`,
        maxWidth: `${maxWidth}px`,
        zIndex: 2147483645,
      }}
    >
      <div className="promptcraft-tag-bar">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="promptcraft-command-pill"
            onMouseEnter={() => setHoveredSkill(skill)}
            onMouseLeave={() => setHoveredSkill(null)}
          >
            {/* 指令前缀代码标识 < > */}
            <span className="promptcraft-pill-brackets">&lt; &gt;</span>
            
            {/* 技能名称 */}
            <span className="promptcraft-pill-title">{skill.title}</span>

            {/* 移除按钮 */}
            <button
              type="button"
              className="promptcraft-pill-close"
              title="移除该技能胶囊 (可在输入框为空时按 Backspace)"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(skill.id);
              }}
            >
              ×
            </button>

            {/* 悬停详细预览卡片 */}
            {hoveredSkill?.id === skill.id && (
              <div className="promptcraft-pill-popover">
                <div className="promptcraft-popover-header">
                  <div className="promptcraft-popover-title">
                    <span className="promptcraft-popover-brackets">&lt; &gt;</span>
                    <span>{skill.title}</span>
                  </div>
                  <span className="promptcraft-popover-category">{skill.category}</span>
                </div>

                {skill.description && (
                  <div className="promptcraft-popover-desc">{skill.description}</div>
                )}

                <div className="promptcraft-popover-preview">
                  <div className="promptcraft-popover-label">系统指令预览：</div>
                  <pre className="promptcraft-popover-code">{skill.template}</pre>
                </div>

                <div className="promptcraft-popover-footer">
                  💡 按 <strong>Enter</strong> 发送时将自动隐式携带此指令，输入框内容作为具体任务参数
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
