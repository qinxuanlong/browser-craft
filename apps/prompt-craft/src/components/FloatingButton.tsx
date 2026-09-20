import React from "react";

interface FloatingButtonProps {
  position: { top: number; left: number };
  onClick: () => void;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  position,
  onClick,
}) => {
  return (
    <div
      className="promptcraft-floating-capsule"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title="PromptCraft 灵感工坊 (Alt+P 唤起)"
      onMouseDown={(e) => e.preventDefault()} // 防止输入框失焦
    >
      <span className="promptcraft-capsule-icon">⚡</span>
      <span className="promptcraft-capsule-text">技能库</span>
    </div>
  );
};
