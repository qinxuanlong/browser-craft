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

PageBox 采用基于 **pnpm workspace + Turborepo** 的现代 Monorepo 体系，实现了多插件应用（Apps）与共享公共库（Packages）的清晰解耦：

```
PageBox/ (多扩展 Monorepo 体系)
├── apps/                                   # 浏览器扩展应用层
│   ├── pagebox/                            # PageBox 核心扩展（WXT + React 19）
│   │   ├── entrypoints/                    # WXT 约定式入口目录
│   │   │   ├── background.ts               # 后台 Service Worker（生命周期与事件管理）
│   │   │   ├── popup/                      # 工具栏弹出面板（快速收藏与轻量浏览）
│   │   │   ├── sidepanel/                  # 原生侧边栏常驻视图（折叠树与拖拽整理）
│   │   │   └── manager/                    # 独立全屏管理后台（双向书签同步/导入导出/数据维护）
│   │   ├── public/                         # 扩展图标与静态资源
│   │   ├── package.json
│   │   └── wxt.config.ts                   # WXT 构建与 Vite 扩展配置
│   └── demo-plugin/                        # 示例与模版扩展（多插件架构参考范例）
│       ├── entrypoints/popup/              # 示例 Popup 入口
│       ├── package.json
│       └── wxt.config.ts
├── packages/                               # 共享与业务代码包
│   ├── # --- 跨扩展通用基础设施库 (@workspace/*) ---
│   ├── shared-license/                     # 商业化 License 激活与离线授权校验服务（Lemon Squeezy）
│   │   └── src/                            # 包含在线激活、离线缓存与本地白名单调试密钥
│   ├── shared-utils/                       # 跨扩展公共工具库
│   │   └── src/                            # 常用 Chrome API 快捷封装、WXT 相对路径修复插件等
│   ├── # --- PageBox 专用分层业务库 (@pagebox/*) ---
│   ├── types/                              # 领域实体与 TypeScript 类型契约（PageItem、FolderItem 等）
│   ├── storage/                            # 本地持久化存储适配层（封装 chrome.storage.local）
│   ├── core/                               # 核心业务逻辑（书签双向同步、数据导入导出、授权编排）
│   └── ui/                                 # 共享 React 组件库（FolderTree、ManagerApp、LicenseModal 等）
├── pnpm-workspace.yaml                     # pnpm 工作区拓扑配置
├── turbo.json                              # Turborepo 任务管道编排与构建缓存
├── tsconfig.base.json                      # 共享基础 TypeScript 编译规范
└── package.json                            # 根工程管理与快捷构建任务
```

### 架构分层与职责说明

| 模块层级 | 包 / 目录 | 命名空间 | 核心职责 |
| :--- | :--- | :--- | :--- |
| **应用层 (Apps)** | `apps/pagebox` | `@apps/pagebox` | 核心标签页管理插件，集成 Popup、Side Panel、独立 Manager 与 Background 四大形态 |
| | `apps/demo-plugin` | `@apps/demo-plugin` | 示例与脚手架插件，展示如何快速开箱消费通用基础设施包 |
| **通用基础设施** | `packages/shared-license` | `@workspace/shared-license` | 通用商业化服务，支持 Lemon Squeezy 激活、离线校验及开发者白名单模拟 |
| | `packages/shared-utils` | `@workspace/shared-utils` | 跨扩展通用工具库，包含 Chrome API 辅助函数与 WXT 构建相对路径修复插件 |
| **PageBox 业务层** | `packages/types` | `@pagebox/types` | 核心数据模型与类型定义，作为各包共享的数据契约，零业务依赖 |
| | `packages/storage` | `@pagebox/storage` | 本地存储适配层，基于 `chrome.storage.local` 提供安全的持久化 CRUD 接口 |
| | `packages/core` | `@pagebox/core` | 业务中台层，承载浏览器书签双向同步算法、JSON 备份导入导出与 License 桥接 |
| | `packages/ui` | `@pagebox/ui` | 视图展示层，提供管理后台、文件夹折叠树、授权弹窗及统一样式主题 |

#### 依赖流向说明 (Dependency Flow)

各模块之间遵循严格的单向依赖规范，杜绝循环引用：
- **`apps/pagebox`** $\rightarrow$ 消费 `@pagebox/ui`、`@pagebox/core` 与 `@workspace/shared-utils`
- **`@pagebox/ui`** $\rightarrow$ 消费 `@pagebox/core` 与 `@pagebox/types`
- **`@pagebox/core`** $\rightarrow$ 消费 `@pagebox/storage`、`@pagebox/types` 与 `@workspace/shared-license`
- **`@pagebox/storage`** $\rightarrow$ 消费 `@pagebox/types`
- **`@workspace/*`** $\rightarrow$ 独立通用基础设施，不依赖任何 `@pagebox/*` 业务包

## 快速开始

```bash
# 安装依赖并链接工作区
pnpm install

# 单独调试 PageBox 插件（热更新）
pnpm dev:pagebox

# 单独调试 Demo 示例插件（热更新）
pnpm dev:demo

# 全量构建所有插件与共享包
pnpm build

# 单独构建指定插件
pnpm build:pagebox
pnpm build:demo
```

开发或构建完成后，对应插件会在各自目录下输出 `.output/chrome-mv3`（如 `apps/pagebox/.output/chrome-mv3`）。在 Chrome 中打开 `chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选择对应插件的 `.output/chrome-mv3` 即可。

### 🧩 如何在此仓库新建一个扩展？

1. 复制 `apps/demo-plugin` 目录为 `apps/<你的插件名>`；
2. 修改 `apps/<你的插件名>/package.json` 中的 `name: "@apps/<你的插件名>"`；
3. 直接在 `dependencies` 中引用共享基础设施：
   - `"@workspace/shared-utils": "workspace:*"`：开箱即用 WXT HTML 构建修复与 Chrome 常用工具。
   - `"@workspace/shared-license": "workspace:*"`：一行代码快速接入统一的会员订阅与离线激活体系。
4. 运行 `pnpm install` 自动建立软链，随后即可运行 `pnpm dev` 开始开发。


## 加载 Side Panel

Popup 中点击「侧边栏」按钮，或在 Chrome 工具栏右键扩展图标选择 Side Panel。

## 需求说明与规划

详细功能需求说明书请参见 [REQUIREMENTS.md](file:///d:/1Aworker/tool/oneclick/PageBox/REQUIREMENTS.md)。

## 支付与会员体系 (Pro 会员)

PageBox 支持会员进阶特权（如智能重复网页清理、Markdown 高级文档导出等），通过 Lemon Squeezy 进行 License 授权与激活。

### 🔑 本地测试白名单密钥

在开发联调或本地测试阶段，无需发起真实支付或请求外部网络，在弹出的激活输入框中直接输入以下任一密钥（不区分大小写）即可完成模拟激活：

- `DEV-TEST-KEY`
- `PAGEBOX-DEV-TEST`
- `PAGEBOX-PRO-VIP`

#### 调试指南：
- **快速激活**：在界面点击「升级解锁 →」，输入上述任一密钥并点击「激活」，系统将自动在本地持久化 Pro 授权，且离线永久有效。
- **恢复免费版**：点击「授权详情」→「解除此设备绑定」，即可一键清除本地授权状态，用于测试非会员功能的拦截引导逻辑。
- **控制台直接注入**（备用方案）：
  ```javascript
  chrome.storage.local.set({
    pagebox_license: {
      isPro: true,
      licenseKey: "DEV-TEST-KEY",
      instanceName: "PageBox_Dev_Chrome",
      customerEmail: "developer@test.com",
      activatedAt: Date.now(),
      lastValidatedAt: Date.now()
    }
  });
  ```

## 后续规划

- [x] 文件夹树状展示（`FolderTree` 折叠树与未分类统计）
- [x] 文件夹前端管理（UI 新建、重命名、删除）
- [x] Pro 会员与许可证激活（Lemon Squeezy 接入与本地测试模式）
- [ ] 标签（tags）编辑与筛选
- [x] 拖拽排序与移动（Drag & Drop）
- [ ] 云端同步接口预留


