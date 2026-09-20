import React, { useEffect, useState } from "react";
import { Skill } from "../types";
import { getAllSkills } from "../services/storage";

export const PopupApp: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    void getAllSkills().then(setSkills);
  }, []);

  const openManager = () => {
    chrome.runtime.sendMessage({ action: "open_manager" });
    window.close();
  };

  const handleCopy = (skill: Skill) => {
    navigator.clipboard.writeText(skill.template);
    setCopiedId(skill.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = skills.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.shortcut.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="promptcraft-popup">
      {/* 顶部标题栏 */}
      <div className="popup-header">
        <div className="popup-brand">
          <span className="popup-logo">⚡</span>
          <div>
            <div className="popup-title">PromptCraft 灵感工坊</div>
            <div className="popup-version">已载入 {skills.length} 套技能资产</div>
          </div>
        </div>
        <button className="popup-manager-btn" onClick={openManager} title="打开全屏管理大页">
          管理中心 ↗
        </button>
      </div>

      {/* 快捷操作贴士 */}
      <div className="popup-tips">
        <div className="tip-badge">网页聊天框内输入 <code>/</code> 即刻智能联想</div>
        <div className="tip-badge">按 <code>Alt + P</code> 随时呼出调色板</div>
      </div>

      {/* 搜索框 */}
      <div className="popup-search-wrap">
        <input
          type="text"
          className="popup-search-input"
          placeholder="搜索技能名称或 /指令..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* 技能列表 */}
      <div className="popup-list">
        {filtered.slice(0, 10).map((skill) => (
          <div key={skill.id} className="popup-item">
            <div className="popup-item-info">
              <div className="popup-item-title-row">
                <span className="popup-cmd">{skill.shortcut}</span>
                <span className="popup-name">{skill.title}</span>
              </div>
              <div className="popup-desc">{skill.description}</div>
            </div>
            <button
              className={`popup-copy-btn ${copiedId === skill.id ? "copied" : ""}`}
              onClick={() => handleCopy(skill)}
              title="复制完整提示词模板"
            >
              {copiedId === skill.id ? "已复制 ✓" : "复制"}
            </button>
          </div>
        ))}
      </div>

      {/* 底部按钮 */}
      <div className="popup-footer">
        <button className="popup-full-btn" onClick={openManager}>
          新建技能 / 结构化构建向导 / 导入导出
        </button>
      </div>
    </div>
  );
};
