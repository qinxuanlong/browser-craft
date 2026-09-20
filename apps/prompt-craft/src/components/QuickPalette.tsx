import React, { useEffect, useRef, useState } from "react";
import { Skill, SkillCategory } from "../types";

interface QuickPaletteProps {
  skills: Skill[];
  onSelect: (skill: Skill) => void;
  onClose: () => void;
  onOpenManager: () => void;
}

const CATEGORIES: { key: SkillCategory; label: string; icon: string }[] = [
  { key: "all", label: "全部", icon: "🌟" },
  { key: "office", label: "职场办公", icon: "💼" },
  { key: "coding", label: "编程开发", icon: "💻" },
  { key: "writing", label: "文案创作", icon: "✍️" },
  { key: "learning", label: "学术研读", icon: "📚" },
];

export const QuickPalette: React.FC<QuickPaletteProps> = ({
  skills,
  onSelect,
  onClose,
  onOpenManager,
}) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 弹窗出现时自动聚焦搜索输入框
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  const filteredSkills = skills.filter((skill) => {
    if (selectedCategory !== "all" && skill.category !== selectedCategory) {
      return false;
    }
    if (!query.trim()) return true;

    const q = query.toLowerCase();
    const titleMatch = skill.title.toLowerCase().includes(q);
    const shortcutMatch = skill.shortcut.toLowerCase().includes(q);
    const descMatch = skill.description.toLowerCase().includes(q);
    const tagMatch = skill.tags.some((t) => t.toLowerCase().includes(q));

    return titleMatch || shortcutMatch || descMatch || tagMatch;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (filteredSkills.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredSkills.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredSkills.length) % filteredSkills.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredSkills[selectedIndex]) {
          onSelect(filteredSkills[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredSkills, selectedIndex, onSelect, onClose]);

  // 滚动聚焦
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="promptcraft-overlay" onClick={onClose}>
      <div
        className="promptcraft-palette"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部搜索框 */}
        <div className="promptcraft-palette-search">
          <span className="promptcraft-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="promptcraft-search-input"
            placeholder="搜索技能名称、/指令、标签或工作流... (Esc 退出)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="promptcraft-clear-btn"
              onClick={() => setQuery("")}
            >
              ×
            </button>
          )}
        </div>

        {/* 分类快捷筛选 */}
        <div className="promptcraft-palette-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`promptcraft-cat-chip ${
                selectedCategory === cat.key ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 技能列表 */}
        <div className="promptcraft-palette-list" ref={listRef}>
          {filteredSkills.length === 0 ? (
            <div className="promptcraft-empty-tip">未找到匹配的技能或指令</div>
          ) : (
            filteredSkills.map((skill, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={skill.id}
                  className={`promptcraft-palette-item ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => onSelect(skill)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="promptcraft-item-main">
                    <div className="promptcraft-item-row1">
                      <span className="promptcraft-palette-cmd">{skill.shortcut}</span>
                      <span className="promptcraft-palette-name">{skill.title}</span>
                      <span className="promptcraft-palette-tag">{skill.category}</span>
                    </div>
                    <div className="promptcraft-palette-desc">
                      {skill.description}
                    </div>
                  </div>
                  <div className="promptcraft-item-action">
                    <span className="promptcraft-enter-hint">回车插入 ↵</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部功能栏 */}
        <div className="promptcraft-palette-footer">
          <div className="promptcraft-footer-hints">
            <span>↑↓ 导航</span>
            <span>↵ 选择</span>
            <span>Esc 关闭</span>
          </div>
          <button
            className="promptcraft-manage-btn"
            onClick={() => {
              onClose();
              onOpenManager();
            }}
          >
            ⚙️ 技能资产库管理
          </button>
        </div>
      </div>
    </div>
  );
};
