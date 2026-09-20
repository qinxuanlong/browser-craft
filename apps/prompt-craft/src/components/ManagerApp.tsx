import React, { useEffect, useRef, useState } from "react";
import { Skill, SkillCategory, CategoryItem } from "../types";
import {
  getAllSkills,
  saveSkill,
  deleteSkill,
  resetToPresets,
  importSkills,
  filterSkills,
  getAllCategories,
  saveCategory,
  deleteCategory,
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

export const ManagerApp: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<SkillCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 自定义新建分类状态
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const list = await getAllSkills();
    setSkills(list);
    const cats = await getAllCategories();
    setCategories(cats);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredSkills = filterSkills(skills, searchQuery, activeCategory);

  // 新建自定义分类
  const handleAddCategory = async () => {
    if (!newCategoryInput.trim()) return;
    const updated = await saveCategory(newCategoryInput.trim(), "📁");
    setCategories(updated);
    setActiveCategory(newCategoryInput.trim());
    setNewCategoryInput("");
    setIsAddingCategory(false);
  };

  // 删除自定义分类
  const handleDeleteCategory = async (cat: CategoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const count = skills.filter((s) => s.category === cat.name || s.category === cat.id).length;
    if (count > 0) {
      if (!confirm(`分类「${cat.name}」下包含 ${count} 个技能，删除分类不会删除技能，确定删除该分类吗？`)) {
        return;
      }
    } else {
      if (!confirm(`确定删除分类「${cat.name}」吗？`)) {
        return;
      }
    }
    const updated = await deleteCategory(cat.id);
    setCategories(updated);
    if (activeCategory === cat.name || activeCategory === cat.id) {
      setActiveCategory("all");
    }
  };

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

  // 恢复出厂预设（精简 3 套展示预设）
  const handleResetPresets = async () => {
    if (confirm("恢复出厂预置将重置为 3 套精简展示技能与默认分类，确定继续吗？")) {
      const presets = await resetToPresets();
      setSkills(presets);
      const cats = await getAllCategories();
      setCategories(cats);
      setActiveCategory("all");
      alert("已成功恢复 3 套官方展示技能！");
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
          <div className="nav-title-row">
            <span className="nav-title" style={{ margin: 0 }}>分类维度</span>
            <button
              type="button"
              className="btn-add-category-mini"
              onClick={() => setIsAddingCategory(true)}
              title="新建自定义分类"
            >
              + 新建
            </button>
          </div>

          {/* 行内新建分类输入框 */}
          {isAddingCategory && (
            <div className="inline-add-category">
              <input
                type="text"
                placeholder="分类名称 (如：写作、客服)..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAddCategory();
                  if (e.key === "Escape") setIsAddingCategory(false);
                }}
              />
              <div className="inline-add-category-actions">
                <button
                  type="button"
                  className="btn-category-confirm"
                  onClick={() => void handleAddCategory()}
                >
                  确定
                </button>
                <button
                  type="button"
                  className="btn-category-cancel"
                  onClick={() => setIsAddingCategory(false)}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 全部技能选项 */}
          <button
            className={`nav-item ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            <div className="nav-item-left">
              <span className="nav-icon">🌟</span>
              <span className="nav-label">全部技能</span>
            </div>
            <span className="nav-count">{skills.length}</span>
          </button>

          {/* 动态分类列表 */}
          {categories.map((cat) => {
            const count = skills.filter(
              (s) => s.category === cat.name || s.category === cat.id
            ).length;
            const isActive = activeCategory === cat.name || activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                <div className="nav-item-left">
                  <span className="nav-icon">{cat.icon || "📁"}</span>
                  <span className="nav-label">{cat.name}</span>
                </div>
                <div className="nav-item-right">
                  <span className="nav-count">{count}</span>
                  {!cat.isPreset && (
                    <span
                      className="btn-del-category"
                      title="删除该自定义分类"
                      onClick={(e) => void handleDeleteCategory(cat, e)}
                    >
                      ×
                    </span>
                  )}
                </div>
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
              🔄 恢复 3 套官方预设
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
            <span className="info-tip">网页聊天框打 <b>/</b> 即可快速联想呼出</span>
          </div>

          {filteredSkills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">当前分类暂无匹配的技能</div>
              <div className="empty-desc">您可以点击右上角「+ 新建技能」创建或使用向导生成</div>
            </div>
          ) : (
            <div className="skills-grid">
              {filteredSkills.map((skill) => {
                const vars = extractVariables(skill.template);
                const isCopied = copiedId === skill.id;

                return (
                  <div key={skill.id} className="skill-card">
                    <div className="card-top">
                      <div className="card-badges">
                        <span className="badge-shortcut">{skill.shortcut}</span>
                        {skill.isPreset && <span className="badge-preset">官方预设</span>}
                        <span className="badge-category">{skill.category}</span>
                      </div>
                    </div>

                    <h3 className="card-title">{skill.title}</h3>
                    <p className="card-desc">{skill.description || "暂无描述"}</p>

                    <div className="card-tags">
                      {skill.tags.map((tag, i) => (
                        <span key={i} className="tag-item">#{tag}</span>
                      ))}
                    </div>

                    {vars.length > 0 && (
                      <div className="card-vars-hint">
                        🧩 包含 {vars.length} 个自适应变量：{vars.map((v) => v.label).join("、")}
                      </div>
                    )}

                    <div className="card-footer">
                      <div className="card-footer-left">
                        <button
                          className={`btn-card-action ${isCopied ? "copied" : ""}`}
                          onClick={() => handleCopyTemplate(skill)}
                        >
                          {isCopied ? "✓ 已复制" : "复制模板"}
                        </button>
                        <button
                          className="btn-card-action"
                          onClick={() => handleExportMarkdown(skill)}
                        >
                          导出 .md
                        </button>
                      </div>

                      <div className="card-footer-right">
                        <button
                          className="btn-icon-action edit"
                          onClick={() => {
                            setEditingSkill(skill);
                            setIsEditorOpen(true);
                          }}
                        >
                          编辑
                        </button>
                        <button
                          className="btn-icon-action delete"
                          onClick={() => handleDeleteSkill(skill.id, skill.title)}
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
          categories={categories}
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
              category: categories[0]?.name || "编程开发",
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
