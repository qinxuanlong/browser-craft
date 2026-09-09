# 本地卡密与不可逆哈希生成工具

用于离线批量生成多插件卡密明文与 SHA-256 哈希库。

## 目录文件说明

- `generate_keys.js`: 核心生成脚本。
- `valid_hashes.json`: 公开哈希数据库（包含各 app_id 及 all_access_bundle 节点）。
- `keys_<app_id>_<timestamp>.txt`: 脚本执行后生成的卡密明文列表（用于导入面包多等平台）。

## 使用方式

### 1. 使用预设快捷命令

```bash
# 生成 100 个 PageBox 卡密
pnpm --filter @workspace/license-tools run gen:pagebox

# 生成 100 个 TreeReader 卡密
pnpm --filter @workspace/license-tools run gen:tree-reader

# 生成 100 个 全家桶卡密
pnpm --filter @workspace/license-tools run gen:bundle
```

### 2. 自定义参数执行

```bash
node generate_keys.js <appId> <count> <prefix>

# 示例：为 my_plugin 生成 50 个以 MP 开头的卡密
node generate_keys.js my_plugin 50 MP
```

## 交付发布流程

1. 将生成的 `keys_*.txt` 文件全选复制，导入到**面包多**商品卡密库中。
2. 将更新后的 `valid_hashes.json` 内容同步推送到你创建的公开 **GitHub Gist** 中。
