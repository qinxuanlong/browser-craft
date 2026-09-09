import type { CSSProperties, SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Windows 风格向右折叠箭头 › */
export function ChevronRight({ size = 12, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 3.5L10.5 8L6 12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Windows 风格向下展开箭头 ⌄ */
export function ChevronDown({ size = 12, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.5 6L8 10.5L12.5 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Windows 资源管理器经典黄色闭合文件夹 */
export function FolderYellowIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 5C2.5 4.17157 3.17157 3.5 4 3.5H7.58579C7.98362 3.5 8.36516 3.65804 8.64645 3.93934L9.85355 5.14645C10.1348 5.42775 10.5164 5.58579 10.9142 5.58579H16C16.8284 5.58579 17.5 6.25736 17.5 7.08579V14.5C17.5 15.3284 16.8284 16 16 16H4C3.17157 16 2.5 15.3284 2.5 14.5V5Z"
        fill="#FFD24D"
      />
      <path
        d="M2.5 7.5C2.5 6.67157 3.17157 6 4 6H16C16.8284 6 17.5 6.67157 17.5 7.5V14.5C17.5 15.3284 16.8284 16 16 16H4C3.17157 16 2.5 15.3284 2.5 14.5V7.5Z"
        fill="#FFC425"
      />
      <path
        d="M3.5 8.5C3.5 8.22386 3.72386 8 4 8H16C16.2761 8 16.5 8.22386 16.5 8.5V14.5C16.5 15.0523 16.0523 15.5 15.5 15.5H4.5C3.94772 15.5 3.5 15.0523 3.5 14.5V8.5Z"
        fill="#FFBE1A"
      />
    </svg>
  );
}

/** Windows 资源管理器黄色展开文件夹 */
export function FolderOpenYellowIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 4.5C2.5 3.67157 3.17157 3 4 3H7.58579C7.98362 3 8.36516 3.15804 8.64645 3.43934L9.85355 4.64645C10.1348 4.92775 10.5164 5.08579 10.9142 5.08579H16C16.8284 5.08579 17.5 5.75736 17.5 6.58579V9H3.5L2.5 4.5Z"
        fill="#FFD24D"
      />
      <path
        d="M2.2 16L4.2 8H17.8L15.8 16H2.2Z"
        fill="#FFBE1A"
      />
      <path
        d="M2.2 16L4.2 8H17.8L15.8 16H2.2Z"
        stroke="#F4B000"
        strokeWidth="0.6"
      />
    </svg>
  );
}

/** “此电脑 / 根库” 蓝色显示器图标 */
export function ThisPcIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2.5" y="3.5" width="15" height="10.5" rx="1.5" fill="#0078D4" />
      <rect x="4" y="5" width="12" height="7.5" rx="0.5" fill="#E6F2FB" />
      <path d="M8.5 14H11.5V16H8.5V14Z" fill="#505050" />
      <path d="M6.5 16H13.5V17H6.5V16Z" fill="#505050" />
    </svg>
  );
}

/** “云盘 / 书签” 蓝云图标 */
export function CloudIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.5 15.5H14C15.933 15.5 17.5 13.933 17.5 12C17.5 10.1581 16.0772 8.64778 14.2764 8.51357C13.8824 5.92985 11.6644 4 9 4C6.0995 4 3.71261 6.22384 3.51478 9.06642C1.77666 9.47953 0.5 11.0425 0.5 12.875C0.5 15.0151 2.23489 16.75 4.375 16.75H6.5V15.5Z"
        fill="#0099FF"
      />
    </svg>
  );
}

/** “磁盘驱动器 / 归档” 驱动器图标 */
export function DriveIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="6" width="14" height="8" rx="1.5" fill="#E1DFDD" stroke="#8A8886" strokeWidth="0.8" />
      <circle cx="6" cy="10" r="1" fill="#107C41" />
      <rect x="11" y="9.5" width="4" height="1" rx="0.5" fill="#605E5C" />
    </svg>
  );
}

/** 窗口多标签集合图标 */
export function WindowGroupIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 8H17" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.5" cy="6" r="0.8" fill="currentColor" />
      <circle cx="8" cy="6" r="0.8" fill="currentColor" />
    </svg>
  );
}

/** 打开新标签大页 External Link 图标 */
export function ExternalLinkIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.5 8.5V13C12.5 13.5523 12.0523 14 11.5 14H3C2.44772 14 2 13.5523 2 13V4.5C2 3.94772 2.44772 3.5 3 3.5H7.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M9.5 2H14V6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10L13.8 2.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 加号图标 */
export function PlusIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** 编辑图标 */
export function EditIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 删除垃圾桶图标 */
export function TrashIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M3 4.5H13M6 4.5V2.5H10V4.5M4.5 4.5L5 13.5H11L11.5 4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 拖拽手柄图标（6 点） */
export function GripVerticalIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...props}>
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

/** 收藏单个标签页图标（书签 + 加号） */
export function BookmarkPlusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.5 2.5C3.5 2.22386 3.72386 2 4 2H9.5C9.77614 2 10 2.22386 10 2.5V13.5L6.75 11.25L3.5 13.5V2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 4.5V8.5M10.5 6.5H14.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 收藏窗口全量标签图标（窗口 + 加号） */
export function WindowSaveIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 5.5H14" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4" cy="4" r="0.6" fill="currentColor" />
      <circle cx="6" cy="4" r="0.6" fill="currentColor" />
      <path d="M8 8V11.5M6.25 9.75H9.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 导出数据图标（托盘 + 向上箭头） */
export function ExportIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 10.5V13C2.5 13.2761 2.72386 13.5 3 13.5H13C13.2761 13.5 13.5 13.2761 13.5 13V10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M8 2.5V9.5M8 2.5L5 5.5M8 2.5L11 5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 导入数据图标（托盘 + 向下箭头） */
export function ImportIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 10.5V13C2.5 13.2761 2.72386 13.5 3 13.5H13C13.2761 13.5 13.5 13.2761 13.5 13V10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M8 2.5V9.5M8 9.5L5 6.5M8 9.5L11 6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 浏览器侧边栏图标 */
export function SidebarIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 2.5V13.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11.5 5H12.5M11.5 7H12.5M11.5 9H12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * PageBox 专属品牌 Logo 图标 (TabBox 灵动收纳魔盒)
 * 融合「Page 浏览器多色标签卡片」+「Box 科技收纳箱」+「P」品牌徽标
 */
export function PageBoxLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <filter id="pbLogoShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.2" />
        </filter>
        <linearGradient id="pbBoxGrad" x1="20" y1="58" x2="108" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="pbBoxInnerGrad" x1="24" y1="46" x2="104" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <linearGradient id="pbCardBlue" x1="26" y1="20" x2="80" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="pbCardCyan" x1="38" y1="24" x2="92" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="pbCardGold" x1="48" y1="30" x2="102" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <g filter="url(#pbLogoShadow)">
        <g transform="rotate(-9 48 48)">
          <rect x="22" y="16" width="54" height="42" rx="7" fill="url(#pbCardBlue)" />
          <circle cx="30" cy="23" r="2.2" fill="#93C5FD" />
          <rect x="37" y="21.5" width="22" height="3" rx="1.5" fill="#BFDBFE" opacity="0.85" />
        </g>
        <g transform="rotate(2 64 48)">
          <rect x="36" y="18" width="56" height="42" rx="7" fill="url(#pbCardCyan)" />
          <circle cx="45" cy="25" r="2.2" fill="#A5F3FC" />
          <rect x="52" y="23.5" width="24" height="3" rx="1.5" fill="#E0F2FE" opacity="0.9" />
        </g>
        <g transform="rotate(11 76 52)">
          <rect x="46" y="22" width="58" height="44" rx="7" fill="url(#pbCardGold)" />
          <circle cx="55" cy="29" r="2.2" fill="#FEF3C7" />
          <rect x="62" y="27.5" width="26" height="3" rx="1.5" fill="#FFFBEB" opacity="0.95" />
        </g>
        <path d="M20 54C20 50.7 22.7 48 26 48H102C105.3 48 108 50.7 108 54V62H20V54Z" fill="url(#pbBoxInnerGrad)" />
        <path d="M18 58C18 54.7 20.7 52 24 52H104C107.3 52 110 54.7 110 58V96C110 102.6 104.6 108 98 108H30C23.4 108 18 102.6 18 96V58Z" fill="url(#pbBoxGrad)" />
        <path d="M18 58C18 54.7 20.7 52 24 52H104C107.3 52 110 54.7 110 58V62H18V58Z" fill="#3B82F6" />
        <line x1="24" y1="53" x2="104" y2="53" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="52" y="72" width="24" height="24" rx="6" fill="#1E3A8A" opacity="0.4" />
        <path d="M60 78H67C68.7 78 70 79.3 70 81C70 82.7 68.7 84 67 84H60V90" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** 皇冠 / Pro 尊贵会员图标 */
export function CrownIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2 19H22V21H2V19ZM2 8L7 13L12 5L17 13L22 8V17H2V8Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 绿色对勾/已激活图标 */
export function CheckCircleIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 12L11 15L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 密钥图标 */
export function KeyIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14 6C11.79 6 10 7.79 10 10C10 10.74 10.2 11.43 10.56 12.02L4 18.59V21H6.41L8 19.41V18H9.41L11.44 15.97C12.21 16.61 13.06 17 14 17C16.21 17 18 15.21 18 13C18 10.79 16.21 6 14 6ZM14 11C13.45 11 13 10.55 13 10C13 9.45 13.45 9 14 9C14.55 9 15 9.45 15 10C15 10.55 14.55 11 14 11Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 通用关闭叉号图标 */
export function CloseIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 默认地球/网页图标（与 Chrome 原生书签地球图标一致，用于无 Favicon 时的兜底） */
export function GlobeIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="8" cy="8" rx="2.8" ry="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 8H14.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.8 4.6H13.2" stroke="currentColor" strokeWidth="1" />
      <path d="M2.8 11.4H13.2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** 柱状统计图表图标 */
export function ChartBarIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3 20H21M18 20V10M12 20V4M6 20V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 盾牌健康度图标 */
export function ShieldCheckIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 22S3 18 3 12V5L12 2L21 5V12C21 18 12 22 12 22Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 脉冲活跃度图标 */
export function ActivityIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M22 12H18L15 21L9 3L6 12H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 火焰热度图标 */
export function FireIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.5 14.5C8.5 16.433 10.067 18 12 18C13.933 18 15.5 16.433 15.5 14.5C15.5 11.5 12 9 12 9C12 9 8.5 11.5 8.5 14.5Z"
        fill="currentColor"
      />
      <path
        d="M12 2C12 2 4 8 4 15C4 19.4183 7.58172 23 12 23C16.4183 23 20 19.4183 20 15C20 9 14.5 5 14.5 5C14.5 5 14 7 12 7C10.5 7 10 5.5 12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 月亮/暗色/沉睡图标 */
export function MoonIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 太阳/浅色模式图标 */
export function SunIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 显示器/跟随系统图标 */
export function MonitorIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2.5" y="3.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 21H16M12 16.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** 旋转刷新图标 */
export function RefreshCwIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M23 4V10H17M1 20V14H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.51 9A9 9 0 0120.49 15M20.49 15L23 10M3.51 9L1 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 警告三角图标 */
export function AlertTriangleIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.29 3.86L1.82 18A2 2 0 003.54 21H20.46A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 全部展开图标（向下双折角展开所有层级，直观易认） */
export function UnfoldMoreIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.75 4.5L8 8.5L12.25 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 8.5L8 12.5L12.25 8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 全部收起图标（向上双折角收起所有层级，杜绝误看成叉号 X） */
export function UnfoldLessIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.75 7.5L8 3.5L12.25 7.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 11.5L8 7.5L12.25 11.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 系统设置齿轮图标 */
export function SettingsIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 现代精致搜索放大镜图标 */
export function SearchIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm8 2l-4.2-4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 编辑铅笔图标 */
export function EditPencilIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14.121 2.879a3 3 0 1 1 4.243 4.242L6.879 18.607 2 20l1.393-4.879 11.493-11.493z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 经典双页剪贴板复制图标 */
export function CopyIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
