import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { zhCN, enUS, type TranslationSchema } from "./locales";

export type Locale = "zh-CN" | "en-US";

const STORAGE_KEY = "pagebox_locale";

/**
 * 检测系统默认语言（以中文环境优先，其余默认为英文）
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

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslationSchema;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "zh-CN",
  setLocale: () => {},
  toggleLocale: () => {},
  t: zhCN,
});

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "zh-CN" || saved === "en-US") return saved;
    }
    return detectDefaultLocale();
  });

  // 异步初始化从 chrome.storage.local 读取（适用于 Chrome 扩展生命周期）
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY]).then((res) => {
        const val = res[STORAGE_KEY] as Locale | undefined;
        if (val === "zh-CN" || val === "en-US") {
          setLocaleState(val);
        }
      }).catch(() => {});

      // 监听跨页面多窗口（Popup / SidePanel / Manager）语言实时同步
      const handleStorageChange = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string,
      ) => {
        if (areaName === "local" && changes[STORAGE_KEY]) {
          const newVal = changes[STORAGE_KEY].newValue as Locale | undefined;
          if (newVal === "zh-CN" || newVal === "en-US") {
            setLocaleState(newVal);
          }
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
      } catch {}
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      void chrome.storage.local.set({ [STORAGE_KEY]: newLocale }).catch(() => {});
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "zh-CN" ? "en-US" : "zh-CN");
  }, [locale, setLocale]);

  const t = useMemo<TranslationSchema>(() => {
    return locale === "zh-CN" ? zhCN : enUS;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * 获取当前语言文案字典及切换方法
 */
export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}
