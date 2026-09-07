import React from "react";
import { NavTabType } from "../../types";
import { FolderIcon, ListIcon, SearchIcon, SlidersIcon } from "../Icons";

interface NavTabsProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
}

export const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="nav-tabs-container">
      {/* 文件夹目录树 Tab */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === "tree" ? "active" : ""}`}
        onClick={() => onTabChange("tree")}
        title="目录树视图"
      >
        <FolderIcon size={16} />
      </button>

      {/* 列表 Tab */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === "list" ? "active" : ""}`}
        onClick={() => onTabChange("list")}
        title="章节列表视图"
      >
        <ListIcon size={16} />
      </button>

      {/* 搜索 Tab */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === "search" ? "active" : ""}`}
        onClick={() => onTabChange("search")}
        title="检索文件与正文"
      >
        <SearchIcon size={16} />
      </button>

      {/* 过滤/设置 Tab */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === "filter" ? "active" : ""}`}
        onClick={() => onTabChange("filter")}
        title="格式过滤与设置"
      >
        <SlidersIcon size={16} />
      </button>
    </div>
  );
};
