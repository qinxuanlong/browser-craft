import React, { useEffect, useRef, useState } from "react";
import { Skill } from "../types";

interface SlashMenuProps {
  skills: Skill[];
  query: string;
  position: { top: number; left: number };
  inputRect?: DOMRect | null;
  onSelect: (skill: Skill) => void;
  onClose: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  skills,
  query,
  position,
  inputRect,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);

  // 过滤当前匹配的技能列表
  const filteredSkills = skills.filter((skill) => {
    const q = query.toLowerCase().replace(/^[\\/、]/, "");
    if (!q) return true;
    const titleMatch = skill.title.toLowerCase().includes(q);
    const shortcutMatch = skill.shortcut.toLowerCase().includes(q);
    const descMatch = skill.description.toLowerCase().includes(q);
    const tagMatch = skill.tags.some((t) => t.toLowerCase().includes(q));
    return titleMatch || shortcutMatch || descMatch || tagMatch;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 键盘快捷键侦听（阻止宿主页面如 DeepSeek 误把回车当成发送消息）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredSkills.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setSelectedIndex((prev) => (prev + 1) % filteredSkills.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setSelectedIndex((prev) => (prev - 1 + filteredSkills.length) % filteredSkills.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (filteredSkills[selectedIndex]) {
          onSelect(filteredSkills[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [filteredSkills, selectedIndex, onSelect, onClose]);

  // 自动滚屏保证当前选中项在视窗内
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (filteredSkills.length === 0) {
    return null;
  }

  // 视窗边界自适应
  const menuWidth = 340;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let finalLeft = position.left;
  if (inputRect && finalLeft < inputRect.left) {
    finalLeft = inputRect.left + 8;
  }
  if (finalLeft + menuWidth > viewportWidth - 20) {
    finalLeft = Math.max(10, viewportWidth - menuWidth - 20);
  }
  if (finalLeft < 10) finalLeft = 10;

  // 判定是否处于视窗下半区（如 DeepSeek/ChatGPT 底部输入栏）
  const isBottomChatbox = inputRect ? inputRect.top > 250 : position.top > 250;

  const dynamicStyle: React.CSSProperties = isBottomChatbox
    ? {
        position: "fixed",
        bottom: inputRect
          ? `${viewportHeight - inputRect.top + 10}px`
          : `${viewportHeight - position.top + 16}px`,
        left: `${finalLeft}px`,
      }
    : {
        position: "fixed",
        top: inputRect ? `${inputRect.bottom + 8}px` : `${position.top + 8}px`,
        left: `${finalLeft}px`,
      };

  return (
    <div
      className="promptcraft-slash-menu"
      style={dynamicStyle}
      onMouseDown={(e) => e.preventDefault()} // 防止输入框失去焦点
    >
      <div className="promptcraft-slash-header">
        <span className="promptcraft-slash-title">⚡ 匹配技能 ({filteredSkills.length})</span>
        <span className="promptcraft-slash-tip">↑↓ 切换 · 回车选择 · Esc 关闭</span>
      </div>

      <div className="promptcraft-slash-list" ref={listRef}>
        {filteredSkills.map((skill, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={skill.id}
              className={`promptcraft-slash-item ${isSelected ? "selected" : ""}`}
              onClick={() => onSelect(skill)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="promptcraft-item-top">
                <span className="promptcraft-item-shortcut">{skill.shortcut}</span>
                <span className="promptcraft-item-name">{skill.title}</span>
                {skill.isPreset && (
                  <span className="promptcraft-item-badge">预置</span>
                )}
              </div>
              <div className="promptcraft-item-desc">{skill.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
