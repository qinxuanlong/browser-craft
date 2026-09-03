# PageBox

标签页收藏与管理浏览器插件（Chrome / Edge · Manifest V3）。

## 功能

- 收藏单个标签页 / 整个窗口
- 搜索（标题、URL、备注、标签）
- 一键恢复已收藏页签
- 备注编辑
- JSON 导入 / 导出
- **手动同步浏览器书签**（点击按钮，单向拉取）
- Popup + Side Panel 双入口

## 技术栈

| 层级 | 技术 |
|------|------|
| Monorepo | pnpm workspace + Turborepo |
| 插件框架 | [WXT](https://wxt.dev) |
| UI | React 19 + TypeScript |
| 存储 | `chrome.storage.local` |

## 项目结构

```
PageBox/
├── apps/
│   └── extension/          # 浏览器插件（WXT）
├── packages/
│   ├── types/              # 共享类型定义
│   ├── storage/            # chrome.storage 封装
│   ├── core/               # 业务逻辑（收藏/搜索/导入导出）
│   └── ui/                 # 共享 React UI
├── pnpm-workspace.yaml
└── turbo.json
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式（热更新）
pnpm dev

# 生产构建
pnpm build
```

开发模式下，WXT 会输出 `.output/chrome-mv3` 目录。在 Chrome 中打开 `chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选择该目录。

## 加载 Side Panel

Popup 中点击「侧边栏」按钮，或在 Chrome 工具栏右键扩展图标选择 Side Panel。

## 后续规划

- [ ] 文件夹 UI（`core` 已支持 `createFolder`）
- [ ] 标签（tags）编辑
- [ ] 拖拽排序
- [ ] 云端同步接口预留
