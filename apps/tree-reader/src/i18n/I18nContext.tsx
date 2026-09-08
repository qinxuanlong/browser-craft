import React, { createContext, useContext, useMemo } from "react";
import { Locale } from "../types";
import { zhCN, enUS, TranslationSchema } from "./locales";

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslationSchema;
}

/**
 * 检测默认语言：系统/浏览器为中文环境则使用 zh-CN，否则默认 en-US
 */
export function detectDefaultLocale(): Locale {
  if (typeof navigator !== "undefined" && navigator.language) {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("zh")) {
      return "zh-CN";
    }
  }
  return "en-US";
}

const I18nContext = createContext<I18nContextValue>({
  locale: "zh-CN",
  setLocale: () => {},
  toggleLocale: () => {},
  t: zhCN,
});

interface I18nProviderProps {
  locale: Locale;
  onLocaleChange: (newLocale: Locale) => void;
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  locale,
  onLocaleChange,
  children,
}) => {
  const toggleLocale = () => {
    const next: Locale = locale === "zh-CN" ? "en-US" : "zh-CN";
    onLocaleChange(next);
  };

  const t = useMemo(() => {
    return locale === "zh-CN" ? zhCN : enUS;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: onLocaleChange,
      toggleLocale,
      t,
    }),
    [locale, onLocaleChange, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextValue => {
  return useContext(I18nContext);
};
