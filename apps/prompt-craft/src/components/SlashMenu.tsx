import React, { useEffect, useRef, useState } from "react";
import { Skill } from "../types";

interface SlashMenuProps {
  skills: Skill[];
  query: string;
  position: { top: number; left: number };
  onSelect: (skill: Skill) => void;
  onClose: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  skills,
  query,
  position,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);

  // 过滤当前匹配的技能列表
  const filteredSkills = skills.filter((skill) => {
    const q = query.toLowerCase();
    const titleMatch = skill.title.toLowerCase().includes(q);
    const shortcutMatch = skill.shortcut.toLowerCase().includes(q);
    const descMatch = skill.description.toLowerCase().includes(q);
    const tagMatch = skill.tags.some((t) => t.toLowerCase().includes(q));
    return titleMatch || shortcutMatch || descMatch || tagMatch;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 键盘快捷键侦听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredSkills.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredSkills.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredSkills.length) % filteredSkills.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredSkills[selectedIndex]) {
          onSelect(filteredSkills[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
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

  // 计算屏幕边界防止弹窗溢出屏幕右侧或下侧
  const menuWidth = 320;
  const menuMaxHeight = 280;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let finalLeft = position.left;
  if (finalLeft + menuWidth > viewportWidth - 20) {
    finalLeft = Math.max(10, viewportWidth - menuWidth - 20);
  }

  let finalTop = position.top;
  if (finalTop + menuMaxHeight > viewportHeight + window.scrollY - 20) {
    finalTop = Math.max(10, position.top - menuMaxHeight - 25);
  }

  return (
    <div
      className="promptcraft-slash-menu"
      style={{
        top: `${finalTop}px`,
        left: `${finalLeft}px`,
      }}
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
                  <span className="promptcraft-item-badge">官方预置</span>
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
