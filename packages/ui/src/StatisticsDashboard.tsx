import React, { useMemo, useState } from "react";
import type { Folder, Id, SavedTab, DeadLinkResult } from "@pagebox/types";
import { checkDeadLinks, findEmptyFolders, pageBoxService } from "@pagebox/core";
import { TabFavicon } from "./Favicon";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  FireIcon,
  FolderYellowIcon,
  MoonIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "./icons";

export interface StatisticsDashboardProps {
  tabs: SavedTab[];
  folders: Folder[];
  onRefresh: () => Promise<void>;
  onNavigateFolder?: (folderId: string) => void;
  onSearchFilter?: (query: string) => void;
  showStatus: (msg: string) => void;
}

type SubTab = "health" | "structure" | "activity";

export function StatisticsDashboard({
  tabs,
  folders,
  onRefresh,
  onNavigateFolder,
  onSearchFilter,
  showStatus,
}: StatisticsDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("health");

  // 死链体检状态
  const [isCheckingDeadLinks, setIsCheckingDeadLinks] = useState(false);
  const [deadLinkProgress, setDeadLinkProgress] = useState<{ checked: number; total: number } | null>(null);
  const [deadLinks, setDeadLinks] = useState<DeadLinkResult[] | null>(null);

  // 1. 健康度治理计算：重复项
  const duplicatesGroup = useMemo(() => {
    const urlMap = new Map<string, SavedTab[]>();
    for (const tab of tabs) {
      if (!tab.url) continue;
      // 归一化 url，去除尾部斜杠
      const cleanUrl = tab.url.replace(/\/+$/, "");
      const list = urlMap.get(cleanUrl) ?? [];
      list.push(tab);
      urlMap.set(cleanUrl, list);
    }
    const groups: { url: string; items: SavedTab[] }[] = [];
    for (const [url, items] of urlMap.entries()) {
      if (items.length > 1) {
        groups.push({ url, items });
      }
    }
    return groups;
  }, [tabs]);

  const totalDuplicateCount = useMemo(() => {
    return duplicatesGroup.reduce((acc, g) => acc + (g.items.length - 1), 0);
  }, [duplicatesGroup]);

  // 2. 健康度治理计算：空文件夹
  const emptyFolders = useMemo(() => {
    return findEmptyFolders(folders, tabs);
  }, [folders, tabs]);

  // 3. 健康度治理计算：未分类标签
  const uncategorizedTabs = useMemo(() => {
    return tabs.filter((t) => t.folderId === null);
  }, [tabs]);

  // 4. 综合健康评分 (0 - 100)
  const healthScore = useMemo(() => {
    let score = 100;
    // 重复项扣分：每个重复副本扣 3 分，上限 30
    score -= Math.min(totalDuplicateCount * 3, 30);
    // 空文件夹扣分：每个扣 2 分，上限 15
    score -= Math.min(emptyFolders.length * 2, 15);
    // 未分类占比扣分：超过 30% 开始扣分，上限 20
    if (tabs.length > 0) {
      const uncatRatio = uncategorizedTabs.length / tabs.length;
      if (uncatRatio > 0.3) {
        score -= Math.min(Math.round((uncatRatio - 0.3) * 40), 20);
      }
    }
    // 死链扣分：如果检测过死链，每个死链扣 5 分
    if (deadLinks && deadLinks.length > 0) {
      score -= Math.min(deadLinks.length * 5, 35);
    }
    return Math.max(score, 10);
  }, [totalDuplicateCount, emptyFolders.length, uncategorizedTabs.length, tabs.length, deadLinks]);

  // 5. 结构分布：Top 域名
  const domainStats = useMemo(() => {
    const counts = new Map<string, { count: number; sampleTab: SavedTab }>();
    for (const tab of tabs) {
      try {
        const parsed = new URL(tab.url);
        const host = parsed.hostname.replace(/^www\./, "");
        if (!host) continue;
        const current = counts.get(host) ?? { count: 0, sampleTab: tab };
        current.count += 1;
        counts.set(host, current);
      } catch {
        // 忽略无效协议
      }
    }

    const sorted = Array.from(counts.entries())
      .map(([domain, data]) => ({
        domain,
        count: data.count,
        sampleTab: data.sampleTab,
        percent: tabs.length > 0 ? ((data.count / tabs.length) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 8);
  }, [tabs]);

  // 6. 结构分布：文件夹容量排行
  const folderCapacities = useMemo(() => {
    const countMap = new Map<Id, number>();
    for (const tab of tabs) {
      if (tab.folderId) {
        countMap.set(tab.folderId, (countMap.get(tab.folderId) ?? 0) + 1);
      }
    }

    const list = folders
      .filter((f) => f.id !== "0")
      .map((f) => ({
        folder: f,
        count: countMap.get(f.id) ?? 0,
        percent: tabs.length > 0 ? (((countMap.get(f.id) ?? 0) / tabs.length) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.count - a.count);

    return list.slice(0, 8);
  }, [folders, tabs]);

  // 7. 结构分布：月度新增趋势（最近 8 个月）
  const monthlyTrends = useMemo(() => {
    const monthMap = new Map<string, number>();
    const now = new Date();
    // 初始化最近 8 个月
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, 0);
    }

    for (const tab of tabs) {
      if (!tab.createdAt) continue;
      const d = new Date(tab.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
      }
    }

    const items = Array.from(monthMap.entries()).map(([month, count]) => ({
      month,
      shortMonth: month.slice(5),
      count,
    }));

    const maxCount = Math.max(...items.map((i) => i.count), 1);
    return { items, maxCount };
  }, [tabs]);

  // 8. 活跃度：常读书签 Top 10
  const topVisitedTabs = useMemo(() => {
    return [...tabs]
      .filter((t) => (t.visitCount ?? 0) > 0)
      .sort((a, b) => (b.visitCount ?? 0) - (a.visitCount ?? 0))
      .slice(0, 10);
  }, [tabs]);

  // 9. 活跃度：沉睡/僵尸书签（加入超过 90 天且从未在 PageBox 中打开过）
  const staleBookmarks = useMemo(() => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 3600 * 1000;
    return tabs.filter((t) => {
      const isOld = t.createdAt < ninetyDaysAgo;
      const isUnvisited = (t.visitCount ?? 0) === 0;
      return isOld && isUnvisited;
    });
  }, [tabs]);

  // 一键死链体检
  const handleStartDeadLinkCheck = async () => {
    setIsCheckingDeadLinks(true);
    setDeadLinkProgress({ checked: 0, total: tabs.length });
    try {
      const results = await checkDeadLinks(tabs, (checked, total) => {
        setDeadLinkProgress({ checked, total });
      });
      setDeadLinks(results);
      showStatus(
        results.length > 0
          ? `体检完成：检测到 ${results.length} 个失效链接`
          : "体检完成：全库链接均可正常访问！"
      );
    } catch {
      showStatus("死链体检出现异常，请稍后重试");
    } finally {
      setIsCheckingDeadLinks(false);
    }
  };

  // 一键清理全部死链
  const handleCleanAllDeadLinks = async () => {
    if (!deadLinks || deadLinks.length === 0) return;
    const confirm = window.confirm(`确定要批量删除检测出的 ${deadLinks.length} 个失效死链吗？此操作不可恢复。`);
    if (!confirm) return;

    await pageBoxService.batchDeleteTabs(deadLinks.map((d) => d.tabId));
    setDeadLinks([]);
    showStatus("已成功清理失效死链");
    await onRefresh();
  };

  // 一键清理所有重复项（每组只保留最早添加的一个）
  const handleCleanAllDuplicates = async () => {
    if (totalDuplicateCount === 0) {
      showStatus("当前没有重复链接需要清理");
      return;
    }
    const confirm = window.confirm(`共检测到 ${totalDuplicateCount} 个多余的重复链接，是否保留首个并删除其余重复项？`);
    if (!confirm) return;

    const toDeleteIds: Id[] = [];
    for (const group of duplicatesGroup) {
      // 保留最早添加的一项，删除其余
      const sorted = [...group.items].sort((a, b) => a.createdAt - b.createdAt);
      for (let i = 1; i < sorted.length; i++) {
        toDeleteIds.push(sorted[i].id);
      }
    }

    await pageBoxService.batchDeleteTabs(toDeleteIds);
    showStatus(`已清理 ${toDeleteIds.length} 个重复书签`);
    await onRefresh();
  };

  // 一键清理所有空文件夹
  const handleCleanAllEmptyFolders = async () => {
    if (emptyFolders.length === 0) {
      showStatus("未检测到空文件夹");
      return;
    }
    const confirm = window.confirm(`检测到 ${emptyFolders.length} 个空文件夹，是否批量删除？`);
    if (!confirm) return;

    await pageBoxService.batchDeleteFolders(emptyFolders.map((f) => f.id));
    showStatus(`已清理 ${emptyFolders.length} 个空文件夹`);
    await onRefresh();
  };

  // 批量断舍离沉睡书签
  const handleCleanStaleBookmarks = async () => {
    if (staleBookmarks.length === 0) return;
    const confirm = window.confirm(
      `确定要将 ${staleBookmarks.length} 个超90天从未打开的书签批量删除吗？请谨慎操作。`
    );
    if (!confirm) return;

    await pageBoxService.batchDeleteTabs(staleBookmarks.map((t) => t.id));
    showStatus(`已批量清理 ${staleBookmarks.length} 个沉睡书签`);
    await onRefresh();
  };

  // 单项删除书签
  const handleDeleteSingleTab = async (tabId: Id) => {
    await pageBoxService.deleteTab(tabId);
    if (deadLinks) {
      setDeadLinks(deadLinks.filter((d) => d.tabId !== tabId));
    }
    showStatus("已删除");
    await onRefresh();
  };

  // 打开书签
  const handleOpenTab = async (tab: SavedTab) => {
    await pageBoxService.restoreTab(tab.id);
    showStatus("已打开页面");
    await onRefresh();
  };

  // 格式化相对时间
  const formatTimeAgo = (ts?: number) => {
    if (!ts) return "从未访问";
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="pagebox-stats">
      {/* 顶部概览指标与健康评分 */}
      <div className="pagebox-stats__hero">
        <div className="pagebox-stats__score-card">
          <div className="pagebox-stats__score-circle">
            <span className="pagebox-stats__score-val">{healthScore}</span>
            <span className="pagebox-stats__score-unit">分</span>
          </div>
          <div className="pagebox-stats__score-info">
            <div className="pagebox-stats__score-title">
              书签健康度：
              {healthScore >= 90 ? (
                <span className="pagebox-badge pagebox-badge--success">优秀</span>
              ) : healthScore >= 75 ? (
                <span className="pagebox-badge pagebox-badge--info">良好</span>
              ) : (
                <span className="pagebox-badge pagebox-badge--warning">需整理</span>
              )}
            </div>
            <div className="pagebox-stats__score-desc">
              根据重复链接、死链存活、空目录及未分类占比综合评估
            </div>
          </div>
        </div>

        <div className="pagebox-stats__hero-kpis">
          <div className="pagebox-kpi-item">
            <span className="pagebox-kpi-num">{tabs.length}</span>
            <span className="pagebox-kpi-label">书签总数</span>
          </div>
          <div className="pagebox-kpi-item">
            <span className="pagebox-kpi-num">{folders.filter((f) => f.id !== "0").length}</span>
            <span className="pagebox-kpi-label">文件夹数</span>
          </div>
          <div className="pagebox-kpi-item">
            <span className="pagebox-kpi-num">{totalDuplicateCount}</span>
            <span className="pagebox-kpi-label">重复链接</span>
          </div>
          <div className="pagebox-kpi-item">
            <span className="pagebox-kpi-num">{emptyFolders.length}</span>
            <span className="pagebox-kpi-label">空文件夹</span>
          </div>
        </div>
      </div>

      {/* 专区 Tab 切换栏 */}
      <div className="pagebox-stats__tabs-bar">
        <button
          className={`pagebox-stats__tab-btn ${activeSubTab === "health" ? "is-active" : ""}`}
          onClick={() => setActiveSubTab("health")}
        >
          <ShieldCheckIcon size={16} />
          <span>健康度与清理治理</span>
          {(totalDuplicateCount > 0 || (deadLinks && deadLinks.length > 0) || emptyFolders.length > 0) && (
            <span className="pagebox-stats__tab-dot" />
          )}
        </button>

        <button
          className={`pagebox-stats__tab-btn ${activeSubTab === "structure" ? "is-active" : ""}`}
          onClick={() => setActiveSubTab("structure")}
        >
          <ChartBarIcon size={16} />
          <span>结构分布与可视化</span>
        </button>

        <button
          className={`pagebox-stats__tab-btn ${activeSubTab === "activity" ? "is-active" : ""}`}
          onClick={() => setActiveSubTab("activity")}
        >
          <FireIcon size={16} />
          <span>活跃度与常读榜</span>
        </button>
      </div>

      {/* 专区 1：健康度与清理治理 */}
      {activeSubTab === "health" && (
        <div className="pagebox-stats__pane">
          {/* 死链体检板块 */}
          <div className="pagebox-stats__card">
            <div className="pagebox-stats__card-header">
              <div className="pagebox-stats__card-title">
                <AlertTriangleIcon size={18} className="pagebox-stats__icon-warn" />
                <span>死链 / 失效网页检测</span>
              </div>
              <div className="pagebox-stats__card-actions">
                <button
                  className="pagebox-btn pagebox-btn--primary"
                  onClick={handleStartDeadLinkCheck}
                  disabled={isCheckingDeadLinks}
                >
                  <RefreshCwIcon size={14} className={isCheckingDeadLinks ? "pagebox-spin" : ""} />
                  {isCheckingDeadLinks ? "体检探测中…" : "开始全库体检"}
                </button>
                {deadLinks && deadLinks.length > 0 && (
                  <button className="pagebox-btn pagebox-btn--danger" onClick={handleCleanAllDeadLinks}>
                    <TrashIcon size={14} /> 一键清理全部死链 ({deadLinks.length})
                  </button>
                )}
              </div>
            </div>

            {/* 体检进度条 */}
            {isCheckingDeadLinks && deadLinkProgress && (
              <div className="pagebox-stats__progress-wrap">
                <div className="pagebox-stats__progress-info">
                  <span>正在检测网络可用性…</span>
                  <span>
                    {deadLinkProgress.checked} / {deadLinkProgress.total} (
                    {Math.round((deadLinkProgress.checked / Math.max(deadLinkProgress.total, 1)) * 100)}%)
                  </span>
                </div>
                <div className="pagebox-stats__progress-bar">
                  <div
                    className="pagebox-stats__progress-fill"
                    style={{
                      width: `${(deadLinkProgress.checked / Math.max(deadLinkProgress.total, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* 死链列表展示 */}
            {deadLinks !== null && !isCheckingDeadLinks && (
              <div className="pagebox-stats__results">
                {deadLinks.length === 0 ? (
                  <div className="pagebox-stats__empty-msg is-success">
                    <CheckCircleIcon size={20} />
                    <span>恭喜！未检测到任何 404 或无法连接的失效死链。</span>
                  </div>
                ) : (
                  <div className="pagebox-stats__list">
                    {deadLinks.map((item) => (
                      <div key={item.tabId} className="pagebox-stats__list-item">
                        <div className="pagebox-stats__item-main">
                          <span className="pagebox-badge pagebox-badge--danger">
                            {item.status ? `HTTP ${item.status}` : item.error || "无法连接"}
                          </span>
                          <span className="pagebox-stats__item-title" title={item.title}>
                            {item.title}
                          </span>
                          <span className="pagebox-stats__item-url" title={item.url}>
                            {item.url}
                          </span>
                        </div>
                        <div className="pagebox-stats__item-actions">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="pagebox-btn-icon"
                            title="在新窗口打开测试"
                          >
                            <ExternalLinkIcon size={13} />
                          </a>
                          <button
                            className="pagebox-btn-icon pagebox-btn-icon--danger"
                            onClick={() => handleDeleteSingleTab(item.tabId)}
                            title="删除该失效书签"
                          >
                            <TrashIcon size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 重复链接治理 */}
          <div className="pagebox-stats__card">
            <div className="pagebox-stats__card-header">
              <div className="pagebox-stats__card-title">
                <span className="pagebox-stats__dot-badge" />
                <span>重复链接治理</span>
                <span className="pagebox-stats__counter-tag">{totalDuplicateCount} 个多余项</span>
              </div>
              {totalDuplicateCount > 0 && (
                <button className="pagebox-btn pagebox-btn--primary" onClick={handleCleanAllDuplicates}>
                  一键清理重复（保留首个）
                </button>
              )}
            </div>

            {duplicatesGroup.length === 0 ? (
              <div className="pagebox-stats__empty-msg is-success">
                <CheckCircleIcon size={20} />
                <span>收藏库内无任何重复 URL，非常整洁！</span>
              </div>
            ) : (
              <div className="pagebox-stats__dup-groups">
                {duplicatesGroup.map((group) => (
                  <div key={group.url} className="pagebox-stats__dup-card">
                    <div className="pagebox-stats__dup-header">
                      <span className="pagebox-stats__dup-url" title={group.url}>
                        {group.url}
                      </span>
                      <span className="pagebox-badge pagebox-badge--info">重复 {group.items.length} 次</span>
                    </div>
                    <div className="pagebox-stats__dup-items">
                      {group.items.map((item, idx) => {
                        const folder = folders.find((f) => f.id === item.folderId);
                        return (
                          <div key={item.id} className="pagebox-stats__dup-subitem">
                            <span className="pagebox-stats__dup-idx">
                              {idx === 0 ? "保留首项" : `副本 #${idx}`}
                            </span>
                            <span className="pagebox-stats__dup-title">{item.title}</span>
                            <span className="pagebox-stats__dup-folder">
                              📁 {folder ? folder.name : "未分类"}
                            </span>
                            {idx > 0 && (
                              <button
                                className="pagebox-btn-icon pagebox-btn-icon--danger"
                                onClick={() => handleDeleteSingleTab(item.id)}
                                title="删除该副本"
                              >
                                <TrashIcon size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 空文件夹与未分类治理 */}
          <div className="pagebox-stats__grid-2">
            {/* 空文件夹 */}
            <div className="pagebox-stats__card">
              <div className="pagebox-stats__card-header">
                <div className="pagebox-stats__card-title">
                  <FolderYellowIcon size={18} />
                  <span>空文件夹清理</span>
                  <span className="pagebox-stats__counter-tag">{emptyFolders.length} 个</span>
                </div>
                {emptyFolders.length > 0 && (
                  <button className="pagebox-btn pagebox-btn--danger" onClick={handleCleanAllEmptyFolders}>
                    一键清理全部
                  </button>
                )}
              </div>
              {emptyFolders.length === 0 ? (
                <div className="pagebox-stats__empty-msg is-success">
                  <CheckCircleIcon size={18} />
                  <span>没有检测到冗余空目录</span>
                </div>
              ) : (
                <div className="pagebox-stats__tag-list">
                  {emptyFolders.map((f) => (
                    <div key={f.id} className="pagebox-stats__folder-chip">
                      <FolderYellowIcon size={14} />
                      <span className="pagebox-stats__chip-text">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 未分类标签占比 */}
            <div className="pagebox-stats__card">
              <div className="pagebox-stats__card-header">
                <div className="pagebox-stats__card-title">
                  <span className="pagebox-tree-icon">📁</span>
                  <span>未分类标签占比</span>
                </div>
              </div>
              <div className="pagebox-stats__metric-box">
                <div className="pagebox-stats__metric-big">
                  {uncategorizedTabs.length}
                  <span className="pagebox-stats__metric-sub">
                    / {tabs.length} (
                    {tabs.length > 0 ? ((uncategorizedTabs.length / tabs.length) * 100).toFixed(1) : "0"}%)
                  </span>
                </div>
                <div className="pagebox-stats__progress-bar">
                  <div
                    className="pagebox-stats__progress-fill"
                    style={{
                      width: `${tabs.length > 0 ? (uncategorizedTabs.length / tabs.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="pagebox-stats__metric-hint">
                  未归入任何文件夹的散落书签。建议归类整理以提升检索效率。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 专区 2：结构分布与可视化 */}
      {activeSubTab === "structure" && (
        <div className="pagebox-stats__pane">
          {/* Top 域名分布 */}
          <div className="pagebox-stats__card">
            <div className="pagebox-stats__card-header">
              <div className="pagebox-stats__card-title">
                <ChartBarIcon size={18} />
                <span>Top 来源域名分布</span>
              </div>
              <span className="pagebox-stats__card-tip">点击域名可直接过滤查看关联书签</span>
            </div>

            <div className="pagebox-stats__bars-list">
              {domainStats.map((item, idx) => (
                <div
                  key={item.domain}
                  className="pagebox-stats__bar-row"
                  onClick={() => onSearchFilter?.(item.domain)}
                  title={`点击查看 ${item.domain} 的 ${item.count} 个书签`}
                >
                  <div className="pagebox-stats__bar-label">
                    <span className="pagebox-stats__bar-idx">{idx + 1}</span>
                    <TabFavicon
                      favIconUrl={item.sampleTab.favIconUrl}
                      url={item.sampleTab.url}
                      title={item.domain}
                    />
                    <span className="pagebox-stats__bar-name">{item.domain}</span>
                  </div>
                  <div className="pagebox-stats__bar-track">
                    <div
                      className="pagebox-stats__bar-fill"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor:
                          idx === 0
                            ? "#4f46e5"
                            : idx === 1
                            ? "#6366f1"
                            : idx === 2
                            ? "#3b82f6"
                            : "#93c5fd",
                      }}
                    />
                  </div>
                  <div className="pagebox-stats__bar-val">
                    <span className="pagebox-stats__bar-count">{item.count} 项</span>
                    <span className="pagebox-stats__bar-pct">{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pagebox-stats__grid-2">
            {/* 文件夹容量排行 */}
            <div className="pagebox-stats__card">
              <div className="pagebox-stats__card-header">
                <div className="pagebox-stats__card-title">
                  <FolderYellowIcon size={18} />
                  <span>文件夹容量排行</span>
                </div>
              </div>
              <div className="pagebox-stats__folder-bars">
                {folderCapacities.map((item) => (
                  <div
                    key={item.folder.id}
                    className="pagebox-stats__folder-bar-item"
                    onClick={() => onNavigateFolder?.(item.folder.id)}
                    title={`点击进入文件夹: ${item.folder.name}`}
                  >
                    <div className="pagebox-stats__fbar-info">
                      <span className="pagebox-stats__fbar-name">📁 {item.folder.name}</span>
                      <span className="pagebox-stats__fbar-count">{item.count} 项</span>
                    </div>
                    <div className="pagebox-stats__fbar-track">
                      <div
                        className="pagebox-stats__fbar-fill"
                        style={{ width: `${Math.min(Number(item.percent) * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 月度新增走势柱状图 */}
            <div className="pagebox-stats__card">
              <div className="pagebox-stats__card-header">
                <div className="pagebox-stats__card-title">
                  <ActivityIcon size={18} />
                  <span>月度新增走势</span>
                </div>
              </div>
              <div className="pagebox-stats__chart-container">
                <div className="pagebox-stats__histogram">
                  {monthlyTrends.items.map((item) => {
                    const heightPercent =
                      monthlyTrends.maxCount > 0 ? (item.count / monthlyTrends.maxCount) * 100 : 0;
                    return (
                      <div key={item.month} className="pagebox-stats__histo-col" title={`${item.month}: 新增 ${item.count} 项`}>
                        <span className="pagebox-stats__histo-val">{item.count > 0 ? item.count : ""}</span>
                        <div className="pagebox-stats__histo-bar-wrap">
                          <div
                            className="pagebox-stats__histo-bar"
                            style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          />
                        </div>
                        <span className="pagebox-stats__histo-label">{item.shortMonth}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 专区 3：活跃度与常读榜 */}
      {activeSubTab === "activity" && (
        <div className="pagebox-stats__pane">
          {/* 常读书签 Top 10 */}
          <div className="pagebox-stats__card">
            <div className="pagebox-stats__card-header">
              <div className="pagebox-stats__card-title">
                <FireIcon size={18} className="pagebox-stats__icon-fire" />
                <span>常读书签 Top 10（高频访问榜）</span>
              </div>
              <span className="pagebox-stats__card-tip">从 PageBox 中点击打开即可累加访问频次</span>
            </div>

            {topVisitedTabs.length === 0 ? (
              <div className="pagebox-stats__empty-msg">
                <ActivityIcon size={20} />
                <span>暂无访问记录。平时通过 PageBox 打开书签，将自动为您积累访问热度榜！</span>
              </div>
            ) : (
              <div className="pagebox-stats__list">
                {topVisitedTabs.map((tab, idx) => (
                  <div key={tab.id} className="pagebox-stats__list-item is-hot">
                    <div className="pagebox-stats__rank-badge">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </div>
                    <TabFavicon favIconUrl={tab.favIconUrl} url={tab.url} title={tab.title} />
                    <div className="pagebox-stats__item-main">
                      <div className="pagebox-stats__item-title" title={tab.title}>
                        {tab.title}
                      </div>
                      <div className="pagebox-stats__item-meta">
                        <span className="pagebox-stats__item-url">{tab.url}</span>
                        <span className="pagebox-stats__meta-split">•</span>
                        <span className="pagebox-stats__time-ago">上次访问: {formatTimeAgo(tab.lastVisitedAt)}</span>
                      </div>
                    </div>
                    <div className="pagebox-stats__hot-count">
                      <FireIcon size={14} />
                      <span>{tab.visitCount} 次打开</span>
                    </div>
                    <div className="pagebox-stats__item-actions">
                      <button
                        className="pagebox-btn pagebox-btn--primary pagebox-btn--sm"
                        onClick={() => handleOpenTab(tab)}
                      >
                        打开
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 沉睡书签治理 */}
          <div className="pagebox-stats__card">
            <div className="pagebox-stats__card-header">
              <div className="pagebox-stats__card-title">
                <MoonIcon size={18} />
                <span>沉睡书签（超过90天从未在插件内打开）</span>
                <span className="pagebox-stats__counter-tag">{staleBookmarks.length} 项</span>
              </div>
              {staleBookmarks.length > 0 && (
                <button className="pagebox-btn pagebox-btn--danger" onClick={handleCleanStaleBookmarks}>
                  一键断舍离全部 ({staleBookmarks.length})
                </button>
              )}
            </div>

            {staleBookmarks.length === 0 ? (
              <div className="pagebox-stats__empty-msg is-success">
                <CheckCircleIcon size={20} />
                <span>太棒了！没有长期沉睡的冷门书签。</span>
              </div>
            ) : (
              <div className="pagebox-stats__stale-list">
                {staleBookmarks.slice(0, 15).map((tab) => {
                  const daysOld = Math.floor((Date.now() - tab.createdAt) / (24 * 3600 * 1000));
                  return (
                    <div key={tab.id} className="pagebox-stats__list-item">
                      <TabFavicon favIconUrl={tab.favIconUrl} url={tab.url} title={tab.title} />
                      <div className="pagebox-stats__item-main">
                        <span className="pagebox-stats__item-title">{tab.title}</span>
                        <span className="pagebox-stats__item-url">{tab.url}</span>
                      </div>
                      <span className="pagebox-badge pagebox-badge--muted">已沉睡 {daysOld} 天</span>
                      <div className="pagebox-stats__item-actions">
                        <button
                          className="pagebox-btn pagebox-btn--sm"
                          onClick={() => handleOpenTab(tab)}
                        >
                          唤醒打开
                        </button>
                        <button
                          className="pagebox-btn-icon pagebox-btn-icon--danger"
                          onClick={() => handleDeleteSingleTab(tab.id)}
                          title="删除该书签"
                        >
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {staleBookmarks.length > 15 && (
                  <div className="pagebox-stats__more-hint">
                    还有 {staleBookmarks.length - 15} 个沉睡书签未在此列出…
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
