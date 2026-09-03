import { useState } from "react";
import { bookmarkSyncService } from "@pagebox/core";

export interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function SyncModal({ isOpen, onClose, onSuccess }: SyncModalProps) {
  const [pulling, setPulling] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  // 1. 浏览器 ➔ 插件
  const handlePullFromBrowser = async () => {
    setPulling(true);
    setErrorMessage("");
    try {
      const result = await bookmarkSyncService.syncFromBrowser();
      const msg = `已从浏览器拉取 ${result.imported} 个书签（${result.folders} 个文件夹）` +
        (result.skipped ? `，跳过 ${result.skipped} 个非普通网页` : "");
      onSuccess(msg);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "拉取失败");
    } finally {
      setPulling(false);
    }
  };

  // 2. 插件 ➔ 浏览器（全量覆盖）
  const handlePushToBrowser = async () => {
    const confirmed = window.confirm(
      "确定要用 PageBox 的全部收藏全量覆盖浏览器书签吗？\n\n此操作将以 PageBox 为唯一基准，清空并完全镜像重构浏览器的收藏夹栏与其他书签。",
    );
    if (!confirmed) return;

    setPushing(true);
    setErrorMessage("");
    try {
      const result = await bookmarkSyncService.syncToBrowser();
      const msg = `已全量覆盖写回浏览器书签（已重构写入 ${result.bookmarksCreated} 个书签，${result.foldersCreated} 个文件夹）`;
      onSuccess(msg);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "全量覆盖浏览器失败");
    } finally {
      setPushing(false);
    }
  };

  const isBusy = pulling || pushing;

  return (
    <div className="pagebox-modal-backdrop" onClick={!isBusy ? onClose : undefined}>
      <div
        className="pagebox-modal pagebox-sync-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pagebox-sync-modal__header">
          <h2>书签双向同步中心</h2>
          <p className="pagebox-sync-modal__subtitle">
            支持按需选择同步方向，安全可靠地在浏览器原生书签与 PageBox 之间流转数据。
          </p>
        </div>

        {errorMessage && (
          <div className="pagebox-sync-modal__error">
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="pagebox-sync-cards">
          {/* 方向 1：浏览器 ➔ 插件 */}
          <div className="pagebox-sync-card">
            <div className="pagebox-sync-card__direction pagebox-sync-card__direction--pull">
              📥 浏览器 ➔ 插件
            </div>
            <h3 className="pagebox-sync-card__title">拉取浏览器书签到插件</h3>
            <p className="pagebox-sync-card__desc">
              扫描当前浏览器的全部书签，自动在 PageBox 中构建对应的文件夹树与标签列表，便于在扩展与大页中管理。
            </p>
            <div className="pagebox-sync-card__action">
              <button
                type="button"
                className="pagebox-btn pagebox-btn--primary"
                disabled={isBusy}
                onClick={handlePullFromBrowser}
              >
                {pulling ? "正在拉取书签…" : "开始拉取到插件"}
              </button>
            </div>
          </div>

          {/* 方向 2：插件 ➔ 浏览器 全量覆盖 */}
          <div className="pagebox-sync-card pagebox-sync-card--overwrite">
            <div className="pagebox-sync-card__direction pagebox-sync-card__direction--push">
              📤 插件 ➔ 浏览器（全量覆盖）
            </div>
            <h3 className="pagebox-sync-card__title">全量覆盖到浏览器书签</h3>
            <p className="pagebox-sync-card__desc">
              以 PageBox 为唯一基准，清空并<strong>全量覆盖重构</strong>浏览器的收藏夹栏与其他书签，使浏览器端与 PageBox 保持 100% 镜像一致。
            </p>
            <div className="pagebox-sync-card__warn-box">
              ⚠️ 注意：将重构浏览器现有书签
            </div>
            <div className="pagebox-sync-card__action">
              <button
                type="button"
                className="pagebox-btn pagebox-btn--primary pagebox-btn--overwrite"
                disabled={isBusy}
                onClick={handlePushToBrowser}
              >
                {pushing ? "正在覆盖写入…" : "确认全量覆盖到浏览器"}
              </button>
            </div>
          </div>
        </div>

        <div className="pagebox-sync-modal__footer">
          <button
            type="button"
            className="pagebox-btn"
            disabled={isBusy}
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
