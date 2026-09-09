# Cloudflare Workers 边缘核销服务

基于 Cloudflare Workers + Workers KV 的免服务器（Serverless）卡密核销系统。

## 部署上线指南

### 1. 准备公开 GitHub Gist
1. 访问 [gist.github.com](https://gist.github.com/)。
2. 创建一个名为 `valid_hashes.json` 的 Gist（公开或不公开链接均可）。
3. 将 `tools/license-tools/valid_hashes.json` 内容粘贴进去并保存。
4. 点击 **Raw** 按钮，复制浏览器地址栏中的 Raw 访问链接（例如：`https://gist.githubusercontent.com/your-name/xxx/raw/valid_hashes.json`）。

### 2. 创建 Cloudflare KV 命名空间
进入本项目 `services/license-worker` 目录，执行：
```bash
# 登录 Cloudflare（首次使用需授权）
npx wrangler login

# 创建生产环境 KV 命名空间
npx wrangler kv:namespace create REDEEMED_KEYS

# （可选）创建开发预览环境 KV 命名空间
npx wrangler kv:namespace create REDEEMED_KEYS --preview
```
根据命令行输出，将生成的 `id`（和 `preview_id`）复制并填入 `wrangler.toml` 中的 `[[kv_namespaces]]`。

### 3. 配置环境变量
在 `wrangler.toml` 的 `[vars]` 中，将 `GIST_RAW_URL` 更新为第 1 步复制的 Raw 链接。

### 4. 发布部署
```bash
npx wrangler deploy
```
部署成功后，终端将输出专属的 Worker 访问地址（例如 `https://pagebox-license-worker.<your-subdomain>.workers.dev`）。
将该地址配置到插件客户端的 `packages/core/src/license.ts` 中即可。
