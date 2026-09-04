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


