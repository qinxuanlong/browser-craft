import type { CSSProperties, SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  style?: CSSProperties;
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

