import React from "react";
import { NavTabType } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
import { FolderIcon, ListIcon, SearchIcon, SlidersIcon } from "../Icons";

interface NavTabsProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
}

export const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  return (
    <div className="nav-tabs-container">
      {/* 文件夹目录树 Tab */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === "tree" ? "active" : ""}`}
        onClick={() => onTabChange("tree")}
        title={t.nav.tree}
      >
        <FolderIcon size={16} />
      </button>

      {/* 列表 Tab */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === "list" ? "active" : ""}`}
        onClick={() => onTabChange("list")}
        title={t.nav.list}
      >
        <ListIcon size={16} />
      </button>

      {/* 搜索 Tab */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === "search" ? "active" : ""}`}
        onClick={() => onTabChange("search")}
        title={t.nav.search}
      >
        <SearchIcon size={16} />
      </button>

      {/* 过滤/设置 Tab */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === "filter" ? "active" : ""}`}
        onClick={() => onTabChange("filter")}
        title={t.nav.filter}
      >
        <SlidersIcon size={16} />
      </button>
    </div>
  );
};
