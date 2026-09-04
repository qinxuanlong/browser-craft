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
PageBox/ (多扩展 Monorepo 体系)
├── apps/
│   ├── pagebox/              # PageBox 标签页收藏插件（WXT + React 19）
│   └── demo-plugin/          # 多插件开发模版/示例扩展
├── packages/
│   ├── # --- 通用基础设施层（跨插件复用）---
│   ├── shared-license/       # 通用 Lemon Squeezy 商业化/会员离线激活服务
│   ├── shared-utils/         # 跨插件通用浏览器扩展辅助与 WXT 路径修复工具
│   ├── # --- PageBox 专有业务层 ---
│   ├── types/                # PageBox 领域实体定义与数据模型
│   ├── storage/              # PageBox 本地数据仓库封装
│   ├── core/                 # PageBox 核心业务逻辑（书签同步/导入导出）
│   └── ui/                   # PageBox 专属管理界面与树组件
├── pnpm-workspace.yaml
└── turbo.json
```

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


