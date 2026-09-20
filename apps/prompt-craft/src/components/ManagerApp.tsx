import React, { useEffect, useRef, useState } from "react";
import { Skill, SkillCategory } from "../types";
import {
  getAllSkills,
  saveSkill,
  deleteSkill,
  resetToPresets,
  importSkills,
  filterSkills,
} from "../services/storage";
import {
  exportSkillsToJson,
  parseSkillsFromJson,
  skillToMarkdown,
  markdownToSkill,
} from "../services/markdownParser";
import { extractVariables } from "../services/variableParser";
import { SkillEditor } from "./SkillEditor";
import { PromptBuilderModal } from "./PromptBuilderModal";

const CATEGORIES: { key: SkillCategory; label: string; icon: string }[] = [
  { key: "all", label: "全部技能", icon: "🌟" },
  { key: "office", label: "职场办公", icon: "💼" },
  { key: "coding", label: "编程开发", icon: "💻" },
  { key: "writing", label: "文案创作", icon: "✍️" },
  { key: "learning", label: "学术研读", icon: "📚" },
  { key: "custom", label: "自定义技能", icon: "🛠️" },
];

export const ManagerApp: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeCategory, setActiveCategory] = useState<SkillCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const list = await getAllSkills();
    setSkills(list);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredSkills = filterSkills(skills, searchQuery, activeCategory);

  // 保存技能
  const handleSaveSkill = async (saved: Skill) => {
    await saveSkill(saved);
    await loadData();
    setIsEditorOpen(false);
    setEditingSkill(null);
  };

  // 删除技能
  const handleDeleteSkill = async (id: string, title: string) => {
    if (confirm(`确定要删除技能「${title}」吗？`)) {
      await deleteSkill(id);
      await loadData();
    }
  };

  // 恢复出厂预设
  const handleResetPresets = async () => {
    if (confirm("恢复出厂预置将覆盖重置所有官方技能，确定继续吗？")) {
      const presets = await resetToPresets();
      setSkills(presets);
      alert("已成功恢复 22 套官方工业级技能！");
    }
  };

  // 复制 Prompt 模板
  const handleCopyTemplate = (skill: Skill) => {
    navigator.clipboard.writeText(skill.template);
    setCopiedId(skill.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // 单条导出为 Markdown 文件
  const handleExportMarkdown = (skill: Skill) => {
    const md = skillToMarkdown(skill);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${skill.title.replace(/[\\/:*?"<>|]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 全量导出为 JSON 备份
  const handleExportJson = () => {
    const jsonStr = exportSkillsToJson(skills);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PromptCraft_Skills_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入文件（支持 .json 或 .md）
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let importedCount = 0;
    const newSkills: Skill[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();

      if (file.name.endsWith(".json")) {
        const parsed = parseSkillsFromJson(text);
        newSkills.push(...parsed);
        importedCount += parsed.length;
      } else if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
        const skill = markdownToSkill(text);
        if (skill) {
          newSkills.push(skill);
          importedCount += 1;
        }
      }
    }

    if (newSkills.length > 0) {
      await importSkills(newSkills, "merge");
      await loadData();
      alert(`成功导入 ${importedCount} 个技能资产！`);
    } else {
      alert("未能从选定文件中解析出有效技能数据。");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="manager-container">
      {/* 隐藏的文件导入框 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".json,.md,.markdown"
        style={{ display: "none" }}
        onChange={handleFileImport}
      />

      {/* 左侧侧边栏 */}
      <aside className="manager-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚡</span>
          <div>
            <div className="brand-name">PromptCraft</div>
            <div className="brand-tagline">灵感工坊 · 技能资产库</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-title">分类维度</div>
          {CATEGORIES.map((cat) => {
            const count =
              cat.key === "all"
                ? skills.length
                : skills.filter((s) => s.category === cat.key).length;
            return (
              <button
                key={cat.key}
                className={`nav-item ${activeCategory === cat.key ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <div className="nav-item-left">
                  <span className="nav-icon">{cat.icon}</span>
                  <span className="nav-label">{cat.label}</span>
                </div>
                <span className="nav-count">{count}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="backup-actions">
            <button className="side-action-btn" onClick={handleExportJson}>
              📥 导出全量备份 (.json)
            </button>
            <button
              className="side-action-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📤 导入文件 (.md / .json)
            </button>
            <button
              className="side-action-btn reset-btn"
              onClick={handleResetPresets}
            >
              🔄 恢复 22 套官方预设
            </button>
          </div>
          <div className="version-info">PromptCraft v0.0.1 · 纯本地隐私安全</div>
        </div>
      </aside>

      {/* 右侧主工作区 */}
      <main className="manager-main">
        {/* 顶栏控制栏 */}
        <header className="manager-header">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索技能名称、/指令、标签或提示词内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <button
              className="btn-builder"
              onClick={() => setIsBuilderOpen(true)}
            >
              🪄 Prompt 构建向导
            </button>
            <button
              className="btn-create"
              onClick={() => {
                setEditingSkill(null);
                setIsEditorOpen(true);
              }}
            >
              + 新建技能
            </button>
          </div>
        </header>

        {/* 技能卡片列表展示区 */}
        <section className="cards-scroll-area">
          <div className="cards-info-bar">
            <span>
              当前展示 <b>{filteredSkills.length}</b> 套技能
            </span>
            <span className="tips-text">
              网页聊天框打 <code>/</code> 即可快速联想呼出
            </span>
          </div>

          {filteredSkills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">未找到匹配的技能资产</div>
              <p>可以尝试切换分类标签或点击上方“+ 新建技能”创建你的专属工作流</p>
            </div>
          ) : (
            <div className="skills-grid">
              {filteredSkills.map((skill) => {
                const vars = extractVariables(skill.template);
                return (
                  <div key={skill.id} className="skill-card">
                    <div className="card-top">
                      <div className="card-badge-row">
                        <span className="card-cmd">{skill.shortcut}</span>
                        {skill.isPreset && (
                          <span className="preset-badge">官方预设</span>
                        )}
                        <span className="cat-badge">{skill.category}</span>
                      </div>
                      <h3 className="card-title">{skill.title}</h3>
                      <p className="card-desc">{skill.description}</p>
                    </div>

                    <div className="card-middle">
                      <div className="tags-row">
                        {skill.tags.map((t) => (
                          <span key={t} className="tag-chip">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="var-count-indicator">
                        {vars.length === 0 ? (
                          <span className="var-none">⚡ 无变量 · 即刻直接注入</span>
                        ) : (
                          <span className="var-has">
                            📝 包含 {vars.length} 个自适应变量：
                            {vars.map((v) => v.label).join("、")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="card-bottom">
                      <div className="card-actions-left">
                        <button
                          className={`btn-card-copy ${
                            copiedId === skill.id ? "copied" : ""
                          }`}
                          onClick={() => handleCopyTemplate(skill)}
                          title="复制完整提示词模板到剪贴板"
                        >
                          {copiedId === skill.id ? "已复制 ✓" : "复制模板"}
                        </button>
                        <button
                          className="btn-card-secondary"
                          onClick={() => handleExportMarkdown(skill)}
                          title="导出为 .md 文件 (含 Frontmatter)"
                        >
                          导出 .md
                        </button>
                      </div>

                      <div className="card-actions-right">
                        <button
                          className="btn-card-edit"
                          onClick={() => {
                            setEditingSkill(skill);
                            setIsEditorOpen(true);
                          }}
                          title="编辑技能"
                        >
                          编辑
                        </button>
                        <button
                          className="btn-card-delete"
                          onClick={() => handleDeleteSkill(skill.id, skill.title)}
                          title="删除技能"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 编辑弹窗 */}
      {isEditorOpen && (
        <SkillEditor
          initialSkill={editingSkill}
          onSave={handleSaveSkill}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingSkill(null);
          }}
          onOpenBuilder={() => setIsBuilderOpen(true)}
        />
      )}

      {/* Prompt 构建向导弹窗 */}
      {isBuilderOpen && (
        <PromptBuilderModal
          onApply={(template, title, shortcut, description) => {
            setEditingSkill({
              id: `skill-${Date.now()}`,
              title: title || "智能构建技能",
              shortcut: shortcut || "/custom",
              category: "custom",
              description: description || "通过向导生成的技能",
              tags: ["构建向导"],
              template,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            setIsEditorOpen(true);
          }}
          onClose={() => setIsBuilderOpen(false)}
        />
      )}
    </div>
  );
};
