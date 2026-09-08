import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "pagebox_theme";

export interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: "system",
  resolvedTheme: "light",
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeMode;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (initialTheme) return initialTheme;
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
    }
    return "system";
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // 监听系统色彩模式偏好变化
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 异步初始化从 chrome.storage.local 读取，并支持多窗口/跨页面实时同步
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local
        .get([THEME_STORAGE_KEY])
        .then((res) => {
          const val = res[THEME_STORAGE_KEY] as ThemeMode | undefined;
          if (val === "light" || val === "dark" || val === "system") {
            setThemeModeState(val);
          }
        })
        .catch(() => {});

      const handleStorageChange = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string,
      ) => {
        if (areaName === "local" && changes[THEME_STORAGE_KEY]) {
          const newVal = changes[THEME_STORAGE_KEY].newValue as ThemeMode | undefined;
          if (newVal === "light" || newVal === "dark" || newVal === "system") {
            setThemeModeState(newVal);
          }
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  const resolvedTheme: "light" | "dark" = useMemo(() => {
    if (themeMode === "system") {
      return systemIsDark ? "dark" : "light";
    }
    return themeMode;
  }, [themeMode, systemIsDark]);

  // 将主题应用到 documentElement 与 body
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.body.setAttribute("data-theme", resolvedTheme);
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("pagebox-theme-dark");
      document.body.classList.add("pagebox-theme-dark");
      document.documentElement.classList.remove("pagebox-theme-light");
      document.body.classList.remove("pagebox-theme-light");
    } else {
      document.documentElement.classList.add("pagebox-theme-light");
      document.body.classList.add("pagebox-theme-light");
      document.documentElement.classList.remove("pagebox-theme-dark");
      document.body.classList.remove("pagebox-theme-dark");
    }
  }, [resolvedTheme]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setThemeModeState(newMode);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newMode);
      } catch {}
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      void chrome.storage.local.set({ [THEME_STORAGE_KEY]: newMode }).catch(() => {});
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setThemeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, resolvedTheme, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
