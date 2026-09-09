import React from "react";
import { useTranslation } from "./i18n";
import { useTheme } from "./ThemeContext";
import {
  GlobeIcon,
  CrownIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SunIcon,
} from "./icons";

export interface SettingsViewProps {
  onCleanDuplicates: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  duplicateCount: number;
  totalTabsCount: number;
  isPro: boolean;
  onOpenLicenseModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onCleanDuplicates,
  onExportMarkdown,
  onExportJson,
  onImportJson,
  duplicateCount,
  totalTabsCount,
  isPro,
  onOpenLicenseModal,
}) => {
  const { t, locale, setLocale } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="pagebox-settings-view">
      <div className="pagebox-settings-container">
        {/* 头部标题区域 */}
      <div className="pagebox-settings-header">
        <div className="pagebox-settings-header__icon">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="pagebox-settings-header__title">
            {t.settings.title}
          </h1>
          <p className="pagebox-settings-header__subtitle">
            {t.settings.subtitle}
          </p>
        </div>
      </div>

      <div className="pagebox-settings-grid">
        {/* 1. 通用偏好卡片 */}
        <section className="pagebox-settings-card">
          <div className="pagebox-settings-card__header">
            <h2 className="pagebox-settings-card__title">
              <GlobeIcon size={16} />
              <span>{t.settings.general}</span>
            </h2>
          </div>

          <div className="pagebox-settings-item">
            <div className="pagebox-settings-item__info">
              <span className="pagebox-settings-item__label">
                {t.settings.language}
              </span>
              <span className="pagebox-settings-item__desc">
                {t.settings.languageDesc}
              </span>
            </div>
            <div className="pagebox-settings-item__action">
              <div className="pagebox-lang-switch-group">
                <button
                  type="button"
                  className={`pagebox-lang-btn ${locale === "zh-CN" ? "is-active" : ""}`}
                  onClick={() => setLocale("zh-CN")}
                >
                  🇨🇳 简体中文
                </button>
                <button
                  type="button"
                  className={`pagebox-lang-btn ${locale === "en-US" ? "is-active" : ""}`}
                  onClick={() => setLocale("en-US")}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>
          </div>

          <div className="pagebox-settings-item">
            <div className="pagebox-settings-item__info">
              <span className="pagebox-settings-item__label">
                {t.settings.theme}
              </span>
              <span className="pagebox-settings-item__desc">
                {t.settings.themeDesc}
              </span>
            </div>
            <div className="pagebox-settings-item__action">
              <div className="pagebox-lang-switch-group pagebox-theme-switch-group">
                <button
                  type="button"
                  className={`pagebox-lang-btn ${themeMode === "light" ? "is-active" : ""}`}
                  onClick={() => setThemeMode("light")}
                  title={t.settings.themeLight}
                >
                  <SunIcon size={14} />
                  <span>{t.settings.themeLight}</span>
                </button>
                <button
                  type="button"
                  className={`pagebox-lang-btn ${themeMode === "dark" ? "is-active" : ""}`}
                  onClick={() => setThemeMode("dark")}
                  title={t.settings.themeDark}
                >
                  <MoonIcon size={14} />
                  <span>{t.settings.themeDark}</span>
                </button>
                <button
                  type="button"
                  className={`pagebox-lang-btn ${themeMode === "system" ? "is-active" : ""}`}
                  onClick={() => setThemeMode("system")}
                  title={t.settings.themeSystem}
                >
                  <MonitorIcon size={14} />
                  <span>{t.settings.themeSystem}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 书签治理与维护卡片 */}
        <section className="pagebox-settings-card">
          <div className="pagebox-settings-card__header">
            <h2 className="pagebox-settings-card__title">
              <ShieldCheckIcon size={16} />
              <span>{t.settings.maintenance}</span>
            </h2>
          </div>

          <div className="pagebox-settings-item">
            <div className="pagebox-settings-item__info">
              <div className="pagebox-settings-item__label-row">
                <span className="pagebox-settings-item__label">
                  {t.settings.cleanDuplicates}
                </span>
                {duplicateCount > 0 ? (
                  <span className="pagebox-badge pagebox-badge--warning">
                    检测到 {duplicateCount} 个重复项
                  </span>
                ) : (
                  <span className="pagebox-badge pagebox-badge--success">
                    无重复书签
                  </span>
                )}
              </div>
              <span className="pagebox-settings-item__desc">
                {t.settings.cleanDuplicatesDesc}
              </span>
            </div>
            <div className="pagebox-settings-item__action">
              <button
                type="button"
                className="pagebox-btn"
                onClick={onCleanDuplicates}
              >
                {t.settings.cleanBtn}
              </button>
            </div>
          </div>
        </section>

        {/* 3. 数据备份与迁移卡片 */}
        <section className="pagebox-settings-card">
          <div className="pagebox-settings-card__header">
            <h2 className="pagebox-settings-card__title">
              <span>💾 {t.settings.backup}</span>
            </h2>
          </div>

          <div className="pagebox-settings-item">
            <div className="pagebox-settings-item__info">
              <span className="pagebox-settings-item__label">
                {t.settings.exportJson}
              </span>
              <span className="pagebox-settings-item__desc">
                {t.settings.exportJsonDesc}
              </span>
            </div>
            <div className="pagebox-settings-item__action">
              <button
                type="button"
                className="pagebox-btn"
                onClick={onExportJson}
              >
                {t.settings.exportJsonBtn}
              </button>
            </div>
          </div>

          <div className="pagebox-settings-item">
            <div className="pagebox-settings-item__info">
              <span className="pagebox-settings-item__label">
                {t.settings.importJson}
              </span>
              <span className="pagebox-settings-item__desc">
                {t.settings.importJsonDesc}
              </span>
            </div>
            <div className="pagebox-settings-item__action">
              <button
                type="button"
                className="pagebox-btn"
                onClick={onImportJson}
              >
                {t.settings.importJsonBtn}
              </button>
            </div>
          </div>

          <div className="pagebox-settings-item">
            <div className="pagebox-settings-item__info">
              <div className="pagebox-settings-item__label-row">
                <span className="pagebox-settings-item__label">
                  {t.settings.exportMarkdown}
                </span>
                {!isPro && (
                  <span className="pagebox-pro-badge">
                    <CrownIcon size={10} /> Pro
                  </span>
                )}
              </div>
              <span className="pagebox-settings-item__desc">
                {t.settings.exportMarkdownDesc}
              </span>
            </div>
            <div className="pagebox-settings-item__action">
              <button
                type="button"
                className="pagebox-btn"
                onClick={onExportMarkdown}
              >
                {t.settings.exportMarkdownBtn}
              </button>
            </div>
          </div>
        </section>

        {/* 4. 关于与本地隐私卡片 */}
        <section className="pagebox-settings-card">
          <div className="pagebox-settings-card__header">
            <h2 className="pagebox-settings-card__title">
              <span>ℹ️ {t.settings.about}</span>
            </h2>
          </div>

          <div className="pagebox-settings-item">
            <div className="pagebox-settings-item__info">
              <span className="pagebox-settings-item__label">
                PageBox Bookmark Manager
              </span>
              <span className="pagebox-settings-item__desc">
                {t.settings.privacyDesc}
              </span>
            </div>
            <div className="pagebox-settings-item__action">
              <div className="pagebox-settings-meta">
                <span className="pagebox-badge">v0.0.1</span>
                {isPro ? (
                  <span className="pagebox-badge pagebox-badge--pro">
                    <CrownIcon size={11} /> Pro 终身版
                  </span>
                ) : (
                  <button
                    type="button"
                    className="pagebox-btn pagebox-btn--sm pagebox-btn--upgrade-inline"
                    onClick={onOpenLicenseModal}
                  >
                    <CrownIcon size={12} /> 升级 Pro
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
  );
};
