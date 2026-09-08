import React, { useEffect, useMemo, useState } from "react";
import type { Folder, Id, SavedTab, DeadLinkResult, HistoryVisitStats } from "@pagebox/types";
import { checkDeadLinks, findEmptyFolders, pageBoxService } from "@pagebox/core";
import { useTranslation } from "./i18n";
import { TabFavicon } from "./Favicon";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CloseIcon,
  CrownIcon,
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
  isPro?: boolean;
  onOpenLicense?: () => void;
}

export interface TabWithActivity extends SavedTab {
  pluginVisitCount: number;
  historyVisitCount: number;
  combinedVisitCount: number;
  effectiveLastVisitedAt?: number;
}

export interface ConfirmModalState {
  title: string;
  message: string;
  warning?: string;
  count?: number;
  items?: { id: string; title: string; subtitle?: string; badge?: string }[];
  confirmText?: string;
  isDanger?: boolean;
  onConfirm: () => Promise<void> | void;
}

type SubTab = "health" | "structure" | "activity";

// 免费用户配额常量
export const FREE_DEAD_LINK_QUOTA = 15;
export const FREE_DUPLICATE_GROUP_QUOTA = 10;

export function StatisticsDashboard({
  tabs,
  folders,
  onRefresh,
  onNavigateFolder,
  onSearchFilter,
  showStatus,
  isPro = false,
  onOpenLicense,
}: StatisticsDashboardProps) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("health");

  // 死链体检状态
  const [isCheckingDeadLinks, setIsCheckingDeadLinks] = useState(false);
  const [deadLinkProgress, setDeadLinkProgress] = useState<{ checked: number; total: number } | null>(null);
  const [deadLinks, setDeadLinks] = useState<DeadLinkResult[] | null>(null);

  // 历史记录辅助统计状态
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryVisitStats>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [enableHistoryAux, setEnableHistoryAux] = useState(true);

  // 批量操作二次确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [isConfirmProcessing, setIsConfirmProcessing] = useState(false);

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

  // 拉取浏览器历史记录访问统计
  const fetchHistoryStats = async () => {
    if (tabs.length === 0) return;
    setIsLoadingHistory(true);
    try {
      const urls = tabs.map((t) => t.url);
      const stats = await pageBoxService.getHistoryStats(urls);
      setHistoryMap(stats);
    } catch (err) {
      console.error("加载浏览器历史记录统计失败:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 切换到“活跃度”标签时，若开启了历史辅助且尚未拉取，自动拉取历史统计
  useEffect(() => {
    if (
      activeSubTab === "activity" &&
      enableHistoryAux &&
      Object.keys(historyMap).length === 0 &&
      !isLoadingHistory &&
      tabs.length > 0
    ) {
      void fetchHistoryStats();
    }
  }, [activeSubTab, enableHistoryAux, tabs.length]);

  // 综合计算插件内打开与历史记录访问统计
  const tabsWithActivity = useMemo<TabWithActivity[]>(() => {
    return tabs.map((t) => {
      const pluginVisitCount = t.visitCount ?? 0;
      const historyStat = historyMap[t.url];
      const historyVisitCount = enableHistoryAux && historyStat ? (historyStat.visitCount ?? 0) : 0;
      const combinedVisitCount = pluginVisitCount + historyVisitCount;
      const historyLastVisit = enableHistoryAux && historyStat ? historyStat.lastVisitTime : undefined;
      const effectiveLastVisitedAt = Math.max(t.lastVisitedAt ?? 0, historyLastVisit ?? 0) || undefined;
      return {
        ...t,
        pluginVisitCount,
        historyVisitCount,
        combinedVisitCount,
        effectiveLastVisitedAt,
      };
    });
  }, [tabs, historyMap, enableHistoryAux]);

  // 8. 活跃度：常读书签（Pro 会员展示 Top 20，免费用户获取 Top 10 并于展示层对 6~10 位加模糊遮罩）
  const topVisitedTabs = useMemo(() => {
    return [...tabsWithActivity]
      .filter((t) => t.combinedVisitCount > 0)
      .sort((a, b) => b.combinedVisitCount - a.combinedVisitCount)
      .slice(0, isPro ? 20 : 10);
  }, [tabsWithActivity, isPro]);

  // 9. 活跃度：沉睡/僵尸书签（加入超90天且插件内未打开，若开启辅助且近90天有历史记录访问则自动唤醒排除）
  const { staleBookmarks, awakenedCount } = useMemo(() => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 3600 * 1000;
    let awakened = 0;
    const staleList: TabWithActivity[] = [];

    for (const t of tabsWithActivity) {
      const isOld = t.createdAt < ninetyDaysAgo;
      const isUnvisitedInPlugin = t.pluginVisitCount === 0;
      if (isOld && isUnvisitedInPlugin) {
        // 如果开启历史辅助，且在历史记录中有 90 天内的访问
        const hasRecentBrowserVisit =
          enableHistoryAux &&
          t.effectiveLastVisitedAt !== undefined &&
          t.effectiveLastVisitedAt >= ninetyDaysAgo;

        if (hasRecentBrowserVisit) {
          awakened++;
        } else {
          staleList.push(t);
        }
      }
    }

    return { staleBookmarks: staleList, awakenedCount: awakened };
  }, [tabsWithActivity, enableHistoryAux]);

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
          ? t.statistics.deadLinksFound(results.length)
          : t.statistics.allLinksHealthy
      );
    } catch {
      showStatus(t.statistics.scanError);
    } finally {
      setIsCheckingDeadLinks(false);
    }
  };

  // 一键清理死链（触发二次确认弹窗，免费用户单次限额 15 条，超出引导解锁 Pro）
  const handleCleanAllDeadLinks = () => {
    if (!deadLinks || deadLinks.length === 0) return;

    const isOverQuota = !isPro && deadLinks.length > FREE_DEAD_LINK_QUOTA;
    const targetDeadLinks = isOverQuota
      ? deadLinks.slice(0, FREE_DEAD_LINK_QUOTA)
      : deadLinks;

    setConfirmModal({
      title: t.statistics.cleanDeadLinksModalTitle,
      message: isOverQuota
        ? t.statistics.cleanDeadLinksQuotaNotice(deadLinks.length, FREE_DEAD_LINK_QUOTA)
        : t.statistics.cleanDeadLinksConfirm(deadLinks.length),
      warning: t.statistics.irreversableWarning,
      count: targetDeadLinks.length,
      items: targetDeadLinks.map((d) => ({
        id: d.tabId,
        title: d.title || d.url,
        subtitle: d.url,
        badge: d.status ? `HTTP ${d.status}` : d.error || t.statistics.deadLinkUnreachable,
      })),
      confirmText: isOverQuota
        ? t.statistics.cleanDeadLinksQuotaBtn(FREE_DEAD_LINK_QUOTA)
        : t.statistics.confirmCleanBtn,
      isDanger: true,
      onConfirm: async () => {
        await pageBoxService.batchDeleteTabs(targetDeadLinks.map((d) => d.tabId));
        const remainingCount = deadLinks.length - targetDeadLinks.length;
        if (remainingCount > 0) {
          setDeadLinks((prev) => (prev ? prev.slice(FREE_DEAD_LINK_QUOTA) : []));
          showStatus(t.statistics.cleanDeadLinksPartialSuccess(targetDeadLinks.length, remainingCount));
          // 引导解锁 Pro 一键彻底清理全部死链
          setTimeout(() => {
            onOpenLicense?.();
          }, 800);
        } else {
          setDeadLinks([]);
          showStatus(t.statistics.cleanDeadLinksSuccess);
        }
        await onRefresh();
      },
    });
  };

  // 一键清理所有重复项（免费用户单次限额清理前 10 组，超出引导解锁 Pro）
  const handleCleanAllDuplicates = () => {
    if (totalDuplicateCount === 0) {
      showStatus(t.statistics.noDuplicates);
      return;
    }

    const isOverQuota = !isPro && duplicatesGroup.length > FREE_DUPLICATE_GROUP_QUOTA;
    const targetGroups = isOverQuota
      ? duplicatesGroup.slice(0, FREE_DUPLICATE_GROUP_QUOTA)
      : duplicatesGroup;

    const toDeleteTabs: SavedTab[] = [];
    for (const group of targetGroups) {
      // 保留最早添加的一项，删除其余
      const sorted = [...group.items].sort((a, b) => a.createdAt - b.createdAt);
      for (let i = 1; i < sorted.length; i++) {
        toDeleteTabs.push(sorted[i]);
      }
    }

    const isQuotaCapped = isOverQuota && totalDuplicateCount > toDeleteTabs.length;

    setConfirmModal({
      title: t.statistics.cleanDuplicatesModalTitle,
      message: isQuotaCapped
        ? t.statistics.cleanDuplicatesQuotaNotice(totalDuplicateCount, FREE_DUPLICATE_GROUP_QUOTA)
        : t.statistics.cleanDuplicatesConfirm(totalDuplicateCount),
      warning: t.statistics.irreversableWarning,
      count: toDeleteTabs.length,
      items: toDeleteTabs.map((tab) => ({
        id: tab.id,
        title: tab.title || tab.url,
        subtitle: tab.url,
      })),
      confirmText: isQuotaCapped
        ? t.statistics.cleanDuplicatesQuotaBtn(FREE_DUPLICATE_GROUP_QUOTA)
        : t.statistics.confirmCleanBtn,
      isDanger: true,
      onConfirm: async () => {
        await pageBoxService.batchDeleteTabs(toDeleteTabs.map((t) => t.id));
        const remainingCount = totalDuplicateCount - toDeleteTabs.length;
        if (remainingCount > 0) {
          showStatus(t.statistics.cleanDuplicatesPartialSuccess(toDeleteTabs.length, remainingCount));
          setTimeout(() => {
            onOpenLicense?.();
          }, 800);
        } else {
          showStatus(t.statistics.cleanDuplicatesSuccess(toDeleteTabs.length));
        }
        await onRefresh();
      },
    });
  };

  // 一键清理所有空文件夹（触发二次确认弹窗）
  const handleCleanAllEmptyFolders = () => {
    if (emptyFolders.length === 0) {
      showStatus(t.statistics.noEmptyFolders);
      return;
    }
    setConfirmModal({
      title: t.statistics.cleanEmptyFoldersModalTitle,
      message: t.statistics.cleanEmptyFoldersConfirm(emptyFolders.length),
      warning: t.statistics.irreversableWarning,
      count: emptyFolders.length,
      items: emptyFolders.map((f) => ({
        id: f.id,
        title: f.name,
      })),
      confirmText: t.statistics.confirmCleanBtn,
      isDanger: true,
      onConfirm: async () => {
        await pageBoxService.batchDeleteFolders(emptyFolders.map((f) => f.id));
        showStatus(t.statistics.cleanEmptyFoldersSuccess(emptyFolders.length));
        await onRefresh();
      },
    });
  };

  // 批量断舍离沉睡书签（触发二次确认弹窗）
  const handleCleanStaleBookmarks = () => {
    if (staleBookmarks.length === 0) return;
    setConfirmModal({
      title: t.statistics.cleanStaleModalTitle,
      message: t.statistics.cleanStaleConfirm(staleBookmarks.length),
      warning: t.statistics.irreversableWarning,
      count: staleBookmarks.length,
      items: staleBookmarks.map((t) => ({
        id: t.id,
        title: t.title || t.url,
        subtitle: t.url,
      })),
      confirmText: t.statistics.confirmCleanBtn,
      isDanger: true,
      onConfirm: async () => {
        await pageBoxService.batchDeleteTabs(staleBookmarks.map((t) => t.id));
        showStatus(t.statistics.cleanStaleSuccess(staleBookmarks.length));
        await onRefresh();
      },
    });
  };

  // 单项删除书签
  const handleDeleteSingleTab = async (tabId: Id) => {
    await pageBoxService.deleteTab(tabId);
    if (deadLinks) {
      setDeadLinks(deadLinks.filter((d) => d.tabId !== tabId));
    }
    showStatus(t.statistics.deletedSuccess);
    await onRefresh();
  };

  // 打开书签
  const handleOpenTab = async (tab: SavedTab) => {
    await pageBoxService.restoreTab(tab.id);
    showStatus(t.statistics.pageOpenedSuccess);
    await onRefresh();
  };

  // 格式化相对时间
  const formatTimeAgo = (ts?: number) => {
    if (!ts) return t.statistics.timeNever;
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t.statistics.timeJustNow;
    if (minutes < 60) return t.statistics.timeMinutesAgo(minutes);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t.statistics.timeHoursAgo(hours);
    const days = Math.floor(hours / 24);
    if (days < 30) return t.statistics.timeDaysAgo(days);
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="pagebox-stats">
      {/* 顶部概览指标与健康评分 */}
      <div className="pagebox-stats__hero">
        <div className="pagebox-stats__score-card">
          <div className="pagebox-stats__score-circle">
            <span className="pagebox-stats__score-val">{healthScore}</span>
            <span className="pagebox-stats__score-unit">{t.statistics.scoreUnit}</span>
          </div>
          <div className="pagebox-stats__score-info">
            <div className="pagebox-stats__score-title">
              {t.statistics.healthScoreTitle}
              {healthScore >= 90 ? (
                <span className="pagebox-badge pagebox-badge--success">{t.statistics.ratingExcellent}</span>
              ) : healthScore >= 75 ? (
                <span className="pagebox-badge pagebox-badge--info">{t.statistics.ratingGood}</span>
              ) : (
                <span className="pagebox-badge pagebox-badge--warning">{t.statistics.ratingNeedsFix}</span>
              )}
            </div>
            <div className="pagebox-stats__score-desc">
              {t.statistics.healthScoreDesc}
            </div>
          </div>
        </div>

        <div className="pagebox-stats__hero-kpis">
          <div className="pagebox-kpi-item">
            <span className="pagebox-kpi-num">{tabs.length}</span>
            <span className="pagebox-kpi-label">{t.statistics.totalTabs}</span>
          </div>
          <div className="pagebox-kpi-item">
            <span className="pagebox-kpi-num">{folders.filter((f) => f.id !== "0").length}</span>
            <span className="pagebox-kpi-label">{t.statistics.totalFolders}</span>
          </div>
          <div className="pagebox-kpi-item">
            <span className="pagebox-kpi-num">{totalDuplicateCount}</span>
            <span className="pagebox-kpi-label">{t.statistics.duplicateLinks}</span>
          </div>
          <div className="pagebox-kpi-item">
            <span className="pagebox-kpi-num">{emptyFolders.length}</span>
            <span className="pagebox-kpi-label">{t.statistics.emptyFolders}</span>
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
          <span>{t.statistics.tabHealth}</span>
          {(totalDuplicateCount > 0 || (deadLinks && deadLinks.length > 0) || emptyFolders.length > 0) && (
            <span className="pagebox-stats__tab-dot" />
          )}
        </button>

        <button
          className={`pagebox-stats__tab-btn ${activeSubTab === "structure" ? "is-active" : ""}`}
          onClick={() => setActiveSubTab("structure")}
        >
          <ChartBarIcon size={16} />
          <span>{t.statistics.tabStructure}</span>
        </button>

        <button
          className={`pagebox-stats__tab-btn ${activeSubTab === "activity" ? "is-active" : ""}`}
          onClick={() => setActiveSubTab("activity")}
        >
          <FireIcon size={16} />
          <span>{t.statistics.tabActivity}</span>
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
                <span>{t.statistics.deadLinkTitle}</span>
                {!isPro && (
                  <span
                    className="pagebox-stats__quota-pill"
                    title={t.statistics.cleanDeadLinksQuotaNotice(deadLinks?.length ?? 0, FREE_DEAD_LINK_QUOTA)}
                  >
                    {t.statistics.freeQuotaTag(FREE_DEAD_LINK_QUOTA)}
                  </span>
                )}
              </div>
              <div className="pagebox-stats__card-actions">
                <button
                  className="pagebox-btn pagebox-btn--primary"
                  onClick={handleStartDeadLinkCheck}
                  disabled={isCheckingDeadLinks}
                >
                  <RefreshCwIcon size={14} className={isCheckingDeadLinks ? "pagebox-spin" : ""} />
                  {isCheckingDeadLinks ? t.statistics.scanning : t.statistics.startScan}
                </button>
                {deadLinks && deadLinks.length > 0 && (
                  <button className="pagebox-btn pagebox-btn--danger" onClick={handleCleanAllDeadLinks}>
                    <TrashIcon size={14} />{" "}
                    {!isPro && deadLinks.length > FREE_DEAD_LINK_QUOTA
                      ? t.statistics.cleanDeadLinksQuotaBtn(FREE_DEAD_LINK_QUOTA)
                      : t.statistics.cleanAllDeadLinksWithCount(deadLinks.length)}
                  </button>
                )}
              </div>
            </div>

            {/* 体检进度条 */}
            {isCheckingDeadLinks && deadLinkProgress && (
              <div className="pagebox-stats__progress-wrap">
                <div className="pagebox-stats__progress-info">
                  <span>{t.statistics.detectingNetwork}</span>
                  <span>
                    {t.statistics.progressText(
                      deadLinkProgress.checked,
                      deadLinkProgress.total,
                      Math.round((deadLinkProgress.checked / Math.max(deadLinkProgress.total, 1)) * 100)
                    )}
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
                    <span>{t.statistics.noDeadLinksFound}</span>
                  </div>
                ) : (
                  <div className="pagebox-stats__list">
                    {deadLinks.map((item) => (
                      <div key={item.tabId} className="pagebox-stats__list-item">
                        <div className="pagebox-stats__item-main">
                          <span className="pagebox-badge pagebox-badge--danger">
                            {item.status ? `HTTP ${item.status}` : item.error || t.statistics.deadLinkUnreachable}
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
                            title={t.statistics.openToVerify}
                          >
                            <ExternalLinkIcon size={13} />
                          </a>
                          <button
                            className="pagebox-btn-icon pagebox-btn-icon--danger"
                            onClick={() => handleDeleteSingleTab(item.tabId)}
                            title={t.statistics.deleteDeadLinkTitle}
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
                <span>{t.statistics.duplicatesTitle}</span>
                <span className="pagebox-stats__counter-tag">{t.statistics.duplicatesCountTag(totalDuplicateCount)}</span>
                {!isPro && (
                  <span className="pagebox-stats__quota-pill">
                    {t.statistics.freeQuotaGroupTag(FREE_DUPLICATE_GROUP_QUOTA)}
                  </span>
                )}
              </div>
              {totalDuplicateCount > 0 && (
                <button className="pagebox-btn pagebox-btn--primary" onClick={handleCleanAllDuplicates}>
                  {!isPro && duplicatesGroup.length > FREE_DUPLICATE_GROUP_QUOTA
                    ? t.statistics.cleanDuplicatesQuotaBtn(FREE_DUPLICATE_GROUP_QUOTA)
                    : t.statistics.cleanAllDuplicatesBtn}
                </button>
              )}
            </div>

            {duplicatesGroup.length === 0 ? (
              <div className="pagebox-stats__empty-msg is-success">
                <CheckCircleIcon size={20} />
                <span>{t.statistics.noDuplicatesClean}</span>
              </div>
            ) : (
              <div className="pagebox-stats__dup-groups">
                {duplicatesGroup.map((group) => (
                  <div key={group.url} className="pagebox-stats__dup-card">
                    <div className="pagebox-stats__dup-header">
                      <span className="pagebox-stats__dup-url" title={group.url}>
                        {group.url}
                      </span>
                      <span className="pagebox-badge pagebox-badge--info">
                        {t.statistics.duplicateCountBadge(group.items.length)}
                      </span>
                    </div>
                    <div className="pagebox-stats__dup-items">
                      {group.items.map((item, idx) => {
                        const folder = folders.find((f) => f.id === item.folderId);
                        return (
                          <div key={item.id} className="pagebox-stats__dup-subitem">
                            <span className="pagebox-stats__dup-idx">
                              {idx === 0 ? t.statistics.keepFirst : t.statistics.duplicateCopyIdx(idx)}
                            </span>
                            <span className="pagebox-stats__dup-title">{item.title}</span>
                            <span className="pagebox-stats__dup-folder">
                              📁 {folder ? folder.name : t.manager.uncategorized}
                            </span>
                            {idx > 0 && (
                              <button
                                className="pagebox-btn-icon pagebox-btn-icon--danger"
                                onClick={() => handleDeleteSingleTab(item.id)}
                                title={t.statistics.deleteCopyTitle}
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
                  <span>{t.statistics.emptyFoldersTitle}</span>
                  <span className="pagebox-stats__counter-tag">{t.statistics.countItems(emptyFolders.length)}</span>
                </div>
                {emptyFolders.length > 0 && (
                  <button className="pagebox-btn pagebox-btn--danger" onClick={handleCleanAllEmptyFolders}>
                    {t.statistics.cleanAllBtn}
                  </button>
                )}
              </div>
              {emptyFolders.length === 0 ? (
                <div className="pagebox-stats__empty-msg is-success">
                  <CheckCircleIcon size={18} />
                  <span>{t.statistics.noEmptyFoldersFound}</span>
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
                  <span>{t.statistics.uncatRatioTitle}</span>
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
                  {t.statistics.uncatRatioHint}
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
                <span>{t.statistics.topDomainsTitle}</span>
              </div>
              <span className="pagebox-stats__card-tip">{t.statistics.topDomainsTip}</span>
            </div>

            <div className="pagebox-stats__bars-list">
              {domainStats.map((item, idx) => (
                <div
                  key={item.domain}
                  className="pagebox-stats__bar-row"
                  onClick={() => onSearchFilter?.(item.domain)}
                  title={t.statistics.viewDomainBookmarks(item.domain, item.count)}
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
                    <span className="pagebox-stats__bar-count">{t.statistics.bookmarksCount(item.count)}</span>
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
                  <span>{t.statistics.folderCapacityTitle}</span>
                </div>
              </div>
              <div className="pagebox-stats__folder-bars">
                {folderCapacities.map((item) => (
                  <div
                    key={item.folder.id}
                    className="pagebox-stats__folder-bar-item"
                    onClick={() => onNavigateFolder?.(item.folder.id)}
                    title={t.statistics.viewFolderTitle(item.folder.name)}
                  >
                    <div className="pagebox-stats__fbar-info">
                      <span className="pagebox-stats__fbar-name">📁 {item.folder.name}</span>
                      <span className="pagebox-stats__fbar-count">{t.statistics.bookmarksCount(item.count)}</span>
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
                  <span>{t.statistics.monthlyTrendTitle}</span>
                </div>
              </div>
              <div className="pagebox-stats__chart-container">
                <div className="pagebox-stats__histogram">
                  {monthlyTrends.items.map((item) => {
                    const heightPercent =
                      monthlyTrends.maxCount > 0 ? (item.count / monthlyTrends.maxCount) * 100 : 0;
                    return (
                      <div key={item.month} className="pagebox-stats__histo-col" title={t.statistics.trendTooltip(item.month, item.count)}>
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
          {/* 常读书签榜（Pro 展示 Top 20，免费展示 Top 5 + 模糊引导） */}
          <div className="pagebox-stats__card">
            <div className="pagebox-stats__card-header pagebox-stats__card-header--split">
              <div className="pagebox-stats__card-title">
                <FireIcon size={18} className="pagebox-stats__icon-fire" />
                <span>{isPro ? t.statistics.popularTop20Title : t.statistics.popularTitle}</span>
                <span className="pagebox-stats__card-tip">{t.statistics.popularTip}</span>
              </div>
              <div className="pagebox-stats__header-actions">
                <label className="pagebox-stats__toggle-label" title={t.statistics.historyAuxTip}>
                  <input
                    type="checkbox"
                    checked={enableHistoryAux}
                    onChange={(e) => setEnableHistoryAux(e.target.checked)}
                  />
                  <span>{t.statistics.enableHistoryAux}</span>
                </label>
                {enableHistoryAux && (
                  <button
                    className="pagebox-btn pagebox-btn--sm"
                    onClick={() => void fetchHistoryStats()}
                    disabled={isLoadingHistory}
                    title={t.statistics.refreshHistoryBtn}
                  >
                    <RefreshCwIcon size={13} className={isLoadingHistory ? "pagebox-spin" : ""} />
                    <span>{isLoadingHistory ? t.statistics.analyzingHistory : t.statistics.refreshHistoryBtn}</span>
                  </button>
                )}
              </div>
            </div>

            {topVisitedTabs.length === 0 ? (
              <div className="pagebox-stats__empty-msg">
                <ActivityIcon size={20} />
                <span>{t.statistics.noVisitsYet}</span>
              </div>
            ) : (
              <div className="pagebox-stats__list">
                {topVisitedTabs.map((tab, idx) => {
                  const isBlurredItem = !isPro && idx >= 5;
                  return (
                    <div
                      key={tab.id}
                      className={`pagebox-stats__list-item is-hot ${isBlurredItem ? "is-blurred" : ""}`}
                    >
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
                          <span className="pagebox-stats__time-ago">
                            {t.statistics.lastVisitedText(formatTimeAgo(tab.effectiveLastVisitedAt))}
                          </span>
                        </div>
                      </div>
                      <div
                        className="pagebox-stats__hot-count"
                        title={enableHistoryAux ? t.statistics.visitBreakdownText(tab.pluginVisitCount, tab.historyVisitCount) : undefined}
                      >
                        <FireIcon size={14} />
                        <span>{t.statistics.combinedVisitCountText(tab.combinedVisitCount)}</span>
                        {enableHistoryAux && (tab.historyVisitCount > 0 || tab.pluginVisitCount > 0) && (
                          <span className="pagebox-stats__breakdown-tag">
                            {t.statistics.visitBreakdownText(tab.pluginVisitCount, tab.historyVisitCount)}
                          </span>
                        )}
                      </div>
                      <div className="pagebox-stats__item-actions">
                        <button
                          className="pagebox-btn pagebox-btn--primary pagebox-btn--sm"
                          onClick={() => handleOpenTab(tab)}
                          disabled={isBlurredItem}
                        >
                          {t.statistics.openBtn}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 免费版超过 5 条时，展示 Pro 升级引导横幅 */}
                {!isPro && topVisitedTabs.length > 5 && (
                  <div className="pagebox-stats__pro-banner">
                    <div className="pagebox-stats__pro-banner-content">
                      <CrownIcon size={18} className="pagebox-stats__pro-crown" />
                      <span>{t.statistics.popularProUnlockBanner}</span>
                    </div>
                    <button
                      type="button"
                      className="pagebox-btn pagebox-btn--buy pagebox-btn--sm"
                      onClick={onOpenLicense}
                    >
                      <CrownIcon size={13} />
                      <span>{t.statistics.unlockProBtn}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 沉睡书签治理 */}
          <div className="pagebox-stats__card">
            <div className="pagebox-stats__card-header">
              <div className="pagebox-stats__card-title">
                <MoonIcon size={18} />
                <span>{t.statistics.staleTitle}</span>
                <span className="pagebox-stats__counter-tag">{t.statistics.countItems(staleBookmarks.length)}</span>
              </div>
              {staleBookmarks.length > 0 && (
                <button className="pagebox-btn pagebox-btn--danger" onClick={handleCleanStaleBookmarks}>
                  {t.statistics.cleanAllStaleWithCount(staleBookmarks.length)}
                </button>
              )}
            </div>

            {enableHistoryAux && awakenedCount > 0 && (
              <div className="pagebox-stats__awakened-banner">
                <CheckCircleIcon size={16} />
                <span>{t.statistics.staleAwakenedHint(awakenedCount)}</span>
              </div>
            )}

            {staleBookmarks.length === 0 ? (
              <div className="pagebox-stats__empty-msg is-success">
                <CheckCircleIcon size={20} />
                <span>{t.statistics.noStaleTip}</span>
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
                      <span className="pagebox-badge pagebox-badge--muted">{t.statistics.staleDays(daysOld)}</span>
                      <div className="pagebox-stats__item-actions">
                        <button
                          className="pagebox-btn pagebox-btn--sm"
                          onClick={() => handleOpenTab(tab)}
                        >
                          {t.statistics.wakeOpen}
                        </button>
                        <button
                          className="pagebox-btn-icon pagebox-btn-icon--danger"
                          onClick={() => handleDeleteSingleTab(tab.id)}
                          title={t.statistics.deleteBookmarkTitle}
                        >
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {staleBookmarks.length > 15 && (
                  <div className="pagebox-stats__more-hint">
                    {t.statistics.staleMoreHint(staleBookmarks.length - 15)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 批量操作二次确认弹窗 */}
      {confirmModal && (
        <div
          className="pagebox-modal-backdrop"
          onClick={() => !isConfirmProcessing && setConfirmModal(null)}
        >
          <div
            className="pagebox-modal pagebox-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="pagebox-modal-header">
              <h2>
                <AlertTriangleIcon size={18} className="pagebox-icon--danger" />
                <span>{confirmModal.title}</span>
              </h2>
              <button
                type="button"
                className="pagebox-modal-close"
                onClick={() => setConfirmModal(null)}
                disabled={isConfirmProcessing}
                title={t.license.close}
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <div className="pagebox-modal-body">
              <p className="pagebox-confirm-modal__desc">{confirmModal.message}</p>
              {confirmModal.warning && (
                <div className="pagebox-confirm-modal__warning">
                  <AlertTriangleIcon size={14} />
                  <span>{confirmModal.warning}</span>
                </div>
              )}

              {confirmModal.items && confirmModal.items.length > 0 && (
                <div className="pagebox-confirm-modal__preview">
                  <div className="pagebox-confirm-modal__preview-header">
                    <span>{t.statistics.previewItemsHeader(confirmModal.items.length)}</span>
                  </div>
                  <div className="pagebox-confirm-modal__preview-list">
                    {confirmModal.items.slice(0, 10).map((item) => (
                      <div key={item.id} className="pagebox-confirm-modal__preview-item">
                        <div className="pagebox-confirm-modal__preview-info">
                          <span className="pagebox-confirm-modal__preview-title">{item.title}</span>
                          {item.subtitle && (
                            <span className="pagebox-confirm-modal__preview-sub">{item.subtitle}</span>
                          )}
                        </div>
                        {item.badge && (
                          <span className="pagebox-badge pagebox-badge--danger">{item.badge}</span>
                        )}
                      </div>
                    ))}
                    {confirmModal.items.length > 10 && (
                      <div className="pagebox-confirm-modal__preview-more">
                        {t.statistics.previewMoreCount(confirmModal.items.length - 10)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pagebox-modal__actions">
              <button
                type="button"
                className="pagebox-btn pagebox-btn--ghost"
                onClick={() => setConfirmModal(null)}
                disabled={isConfirmProcessing}
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                className={`pagebox-btn ${confirmModal.isDanger ? "pagebox-btn--danger" : "pagebox-btn--primary"}`}
                onClick={async () => {
                  setIsConfirmProcessing(true);
                  try {
                    await confirmModal.onConfirm();
                    setConfirmModal(null);
                  } catch (err) {
                    console.error("执行批量清理失败:", err);
                    showStatus(t.statistics.scanError || "操作失败，请重试");
                  } finally {
                    setIsConfirmProcessing(false);
                  }
                }}
                disabled={isConfirmProcessing}
              >
                {isConfirmProcessing ? (
                  <>
                    <RefreshCwIcon size={13} className="pagebox-spin" />
                    <span>{t.statistics.cleaningInProgress}</span>
                  </>
                ) : (
                  confirmModal.confirmText ?? t.common.confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
