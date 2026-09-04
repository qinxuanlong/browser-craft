import { useEffect, useState, type CSSProperties } from "react";
import { GlobeIcon } from "./icons";

/**
 * 提取 URL 的 Origin 根路径（含末尾斜杠），用于降级匹配
 * 若传入的 url 已经是根路径或无法解析，则返回 null
 */
export function getOriginUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      const originWithSlash = `${parsed.origin}/`;
      // 如果原始 URL 本身就是 origin 或 origin/，无需重复尝试
      if (rawUrl === parsed.origin || rawUrl === originWithSlash) {
        return null;
      }
      return originWithSlash;
    }
  } catch {
    // 忽略格式不合法 URL
  }
  return null;
}

/**
 * 获取 Chrome / Edge 扩展原生 _favicon 缓存图标 URL
 * @param url 目标网站网页地址
 * @param size 请求图标尺寸（默认 32px，以便在 Retina/高分屏以 16px 显示时保持超清）
 */
export function getFaviconUrl(url?: string, size = 32): string {
  if (!url) return "";
  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      const faviconUrl = new URL(chrome.runtime.getURL("/_favicon/"));
      faviconUrl.searchParams.set("pageUrl", url);
      faviconUrl.searchParams.set("size", size.toString());
      return faviconUrl.toString();
    }
  } catch {
    // 兼容非插件环境或异常情况
  }
  return "";
}

export interface TabFaviconProps {
  /** 网页地址（用于生成 Chrome 原生 _favicon URL） */
  url?: string;
  /** 显式传入的图标地址（若已有已存储的高清图标） */
  favIconUrl?: string;
  /** 图标渲染尺寸（默认 16px） */
  size?: number;
  /** 自定义 CSS 类名 */
  className?: string;
  /** 额外内联样式 */
  style?: CSSProperties;
  /** 悬浮提示文案 */
  title?: string;
}

type FaviconStage = "favIconUrl" | "nativeFavicon" | "nativeFaviconOrigin" | "globe";

/**
 * 标签页通用 Favicon 图标组件
 * - 优先尝试显式 favIconUrl（已保存的真实图标）
 * - 其次使用 Chrome/Edge 原生 _favicon 本地缓存服务（完整 URL 精确匹配）
 * - 若精确匹配失败（常见于内网/带复杂参数链接），降级使用 Origin 根域名重试
 * - 最终失败时自动降级渲染 Chrome 风格的矢量 GlobeIcon 地球图标
 */
export function TabFavicon({
  url,
  favIconUrl,
  size = 16,
  className,
  style,
  title,
}: TabFaviconProps) {
  const getInitialStage = (): FaviconStage => {
    if (favIconUrl) return "favIconUrl";
    if (url) return "nativeFavicon";
    return "globe";
  };

  const [stage, setStage] = useState<FaviconStage>(getInitialStage);

  // 当 URL 变更时重置阶段
  useEffect(() => {
    setStage(getInitialStage());
  }, [url, favIconUrl]);

  const handleError = () => {
    if (stage === "favIconUrl") {
      if (url && getFaviconUrl(url)) {
        setStage("nativeFavicon");
      } else {
        const origin = getOriginUrl(url);
        if (origin && getFaviconUrl(origin)) {
          setStage("nativeFaviconOrigin");
        } else {
          setStage("globe");
        }
      }
    } else if (stage === "nativeFavicon") {
      // 完整 URL 无法加载时，尝试使用 Origin 根域名二次匹配
      const origin = getOriginUrl(url);
      if (origin && getFaviconUrl(origin)) {
        setStage("nativeFaviconOrigin");
      } else {
        setStage("globe");
      }
    } else {
      setStage("globe");
    }
  };

  if (stage === "globe") {
    return (
      <GlobeIcon
        size={size}
        className={className}
        style={{
          width: size,
          height: size,
          color: "#707070",
          flexShrink: 0,
          ...style,
        }}
        title={title}
      />
    );
  }

  let currentSrc = "";
  if (stage === "favIconUrl") {
    currentSrc = favIconUrl || "";
  } else if (stage === "nativeFavicon") {
    currentSrc = getFaviconUrl(url, 32);
  } else if (stage === "nativeFaviconOrigin") {
    const origin = getOriginUrl(url);
    currentSrc = origin ? getFaviconUrl(origin, 32) : "";
  }

  if (!currentSrc) {
    return (
      <GlobeIcon
        size={size}
        className={className}
        style={{
          width: size,
          height: size,
          color: "#707070",
          flexShrink: 0,
          ...style,
        }}
        title={title}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt=""
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "2px",
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
      onError={handleError}
      title={title}
      loading="lazy"
      draggable={false}
    />
  );
}
