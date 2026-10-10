# Atoms Demo

一个 Atoms 风格的 AI Agent 应用生成平台：用一句话描述想要的 Web 应用，由 Mike（Team Leader）、Emma（产品经理）、Bob（架构师）、Alex（工程师）组成的 AI 团队协作生成代码，在右侧实时预览，并可继续对话迭代、回滚版本、一键发布成公开链接。

> 🚧 开发中。完整需求与工程计划见 [docs/PRD.md](docs/PRD.md)。

## 技术栈

- **前端**：Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui
- **后端**：[InsForge](https://insforge.dev)：Postgres + Auth + RLS，Model Gateway（OpenRouter）
- **模型**：Claude Sonnet 5.5（工程师 Alex）· Claude Haiku 5.5（Mike / Emma / Bob）
- **部署**：InsForge Sites

## 完成度

| 功能 | 状态 |
|---|---|
| 注册 / 登录 / 体验账号 | ⏳ |
| 项目列表 | ⏳ |
| 多 Agent 流式生成 | ⏳ |
| 代码查看 + 实时预览 | ⏳ |
| 对话式迭代 | ⏳ |
| 一键发布 | ⏳ |
| 版本历史与回滚 | ⏳ |
| Issue Report + Resolve | ⏳ |
| Discover + Remix | ⏳ |

## 在线体验

https://53bg3mbj.insforge.site （开发中，目前只有占位页）

## 本地运行

需要 Node 22（见 `.nvmrc`）和已登录的 InsForge CLI。

```bash
npm install
cp .env.example .env.local   # 按注释填写；LLM_MOCK=1 时不调用模型
npm run dev
```

数据库迁移在 `migrations/`，认证配置在 `insforge.toml`：

```bash
npx @insforge/cli db migrations up --all
npx @insforge/cli config apply
```

## 关键取舍

- **生成接口放在 Next.js Route Handler。** M0 在线上压测：`/api/stream-test` 连续 150 秒每秒推一条 SSE，逐条实时到达、没有断流或缓冲（2026-10-10），足够覆盖一次完整生成（≤ 120 秒）。不需要迁到 Edge Function / Compute。
