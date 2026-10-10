# Atoms Lite — 详细工程计划

> 版本 v1.1 · 2026-10-10（新增 §6 部署后实施计划） · 基于 [PRD.md](PRD.md)（含 §6.0 省额度策略、§7 验收标准）
> PRD 回答"做什么、为什么、怎样算合格"；本文回答"按什么顺序做、每一步拆成哪些任务、每个里程碑结束时用什么证明它完成了"。
> 范围、数据模型、协议、最终验收以 PRD 为准。文中 `F1–F9`、`E1–E6` 指 PRD §3 的功能，`T1–T13` 指 PRD §7.3 的线上用例；`N1–N5 / V1` 与 `T14–T21` 是新增部署后范围及 PRD §7.6 验收。

---

## 0. 总览

### 0.1 排序原则

1. **先消掉风险最高的未知数，再堆功能。** 两个最大的未知数："Sites 上的函数能不能撑住 2 分钟流式"和"LLM 输出能不能稳定解析成可运行的文件"。所以 M0 做流式压测，M2 先做无 UI 的生成核心并配单测。
2. **Mock 优先，省额度。** InsForge Free 只有 $1 AI 额度（PRD §6.0）。M2 先做 `LLM_MOCK=1` 回放，之后 UI、写库、版本、发布全部用 mock 开发；真实调用只用来录 fixture、联调和最终验收。
3. **后端先于前端，纯函数先于集成。** 解析器、预览拼装、编排器都是不依赖 Next.js 的纯函数，先测再接 UI。
4. **每个里程碑结束都可上线、可演示。** 里程碑 = commit + 部署 + 更新 README 完成度表。
5. **P0 全部完成（M4）之前不碰 P1。** P1 按"亮点/成本比"排序，做到哪算哪。

### 0.2 里程碑一览

| 里程碑 | 时长 | 累计 | 主题 | 结束时能演示什么 | 对应 PRD 验收 | Commit |
|---|---|---|---|---|---|---|
| **M0** | 0.75h | 0.75h | 脚手架 + 上线 + 压测 | 空站点在 `*.insforge.site` 可访问；流式压测结论 | 7.4 工程质量（CI） | `chore: scaffold` |
| **D0** | 0.5h | 1.25h | Design system（impeccable 流程） | `PRODUCT.md` + `DESIGN.md` + token 落进 Tailwind；一页组件样张 | 4.3 视觉风格（替代） | `feat(ui): design system` |
| **M1** | 1h | 2.25h | 账号 + 项目 | 注册/登录/体验账号；Dashboard 增删改项目 | F1、F2（创建部分）、F3；T1、T2、T12 | `feat: auth & projects` |
| **M2** | 1.5h | 3.75h | 生成核心（无 UI） | 脚本调 `/api/generate` 输出完整事件流（mock 和真实各一次），DB 有版本 | F4 ②⑥、F7（后端）、F8（写库） | `feat: agent pipeline` |
| **M3** | 1.5h | 5.25h | 工作台 UI | 浏览器里一句话生成番茄钟并能玩 | F4、F5、F6；T3、T4 | `feat: workspace` |
| **M4** | 0.75h | 6h | 迭代 + 发布（**P0 完成**） | 二轮修改；`/p/{slug}` 隐身窗口可用 | F7、F8、F9；T5、T8、T9、T11 | `feat: iterate & publish` |
| **M5** | 1h | 7h | P1 延展 | E2 → E1 → E3 → E6，做完一个部署一个 | E1–E3、E6；T6、T7 | `feat: …` 各一 |
| **M6** | 0.5h | 7.5h | 打磨 | 空/错/加载状态、移动端、限流提示 | T13、7.4 | `style: polish` |
| **M7** | 0.5h | 8h | 交付 | README、GIF、3 个已发布示例、T1–T13 全部通过 | 7.5、§8 | `docs: readme` |

> 相比 PRD §6.1：新增 D0（先出完整 design system 再写任何界面）；M4 从 0.5h 调到 0.75h（发布页还需要用 CSP sandbox 做同域隔离，见 M4.3）；P1 压到 1h；不再留缓冲，超时由 G3 吸收。

### 0.3 依赖关系与关键路径

```
M0 ──► D0 ──► M1 ──► M2 ──► M3 ──► M4 ══ P0 完成 ══► M5 ──► M6 ──► M7
 │             │      ▲
 └ G1 压测结论 ─┘      │
               M2 的 mock 回放 + fixture 是 M3/M4/M5 开发的前提
               buildPreviewHtml 及单测可在 M2 期间并行写
```

关键路径是 M0→M4 的串行链。M2 产出的 **mock 模式**决定了之后所有 UI 开发是否消耗额度，必须在 M2 内完成，不能往后拖。

### 0.4 决策关口（Gate）

| Gate | 时点 | 问题 | 默认 | 不满足时 |
|---|---|---|---|---|
| **G1** | M0 末 | Sites 上 Route Handler 能否稳定流式 ≥ 150 秒（PRD 要求生成 ≤ 120 秒，留余量）？ | 能 → `/api/generate` 留在 Next.js | 不能 → 平移到 InsForge Edge Function（编排器是纯函数，只换路由层）；再不行用 Compute |
| **G2** | M2 第一次真实调用前 | 额度是否够录 fixture + 联调？ | 已定：Free $1 + mock 优先 + 开发期全用 Haiku（PRD §1.4、§6.0） | 余额 < $0.3 → 先只录 1 个 fixture，其余 mock |
| **G3** | M4 末 | P0 是否在 6h 内完成？ | 是 → 按序做 P1 | 否 → P1 只做 E2 + E1 的 Restore（满足"至少 2 项"） |
| **G4** | M7 前 | 剩余额度够不够评审试用（约 7 次 Sonnet 生成）？项目会不会被暂停？ | 够 → 保持 Free + schedule 保活 | 不够 → 升级 Pro 或换自带 OpenRouter key（只改环境变量），PRD §9-1 |

### 0.5 每个里程碑通用的完成定义（DoD）

除各自的验收标准外，每个里程碑还必须：

- [ ] 本地 `npm run typecheck && npm run lint && npm run test && npm run build` 全部通过
- [ ] CI（GitHub Actions）绿
- [ ] `npm run deploy` 成功，线上能访问本里程碑的新功能
- [ ] 一个 Conventional Commit 推到 `main`
- [ ] README「完成度」表更新
- [ ] 没有新增 `NEXT_PUBLIC_*` 形式的密钥；`git grep` 搜不到真实 key
- [ ] 记录本里程碑实际用时和真实 LLM 花费（写在本文末尾的进度表里）

---

## M0 — 脚手架 + 上线 + 压测（0.75h）

**目标**：把"能部署"和"能长时间流式"这两个基础设施风险在第一个小时内消掉。

### 任务

| # | 任务 | 细节 |
|---|---|---|
| 0.1 | 本地工具链 | Node 用 22 LTS（本机是 25，写 `.nvmrc` = `22`，CI 也用 22）；包管理用 `npm`（本机 pnpm 坏）；git 用 `/usr/bin/git` |
| 0.2 | InsForge 项目 | `npx @insforge/cli` 创建并 link（`.insforge/project.json` 已 gitignore）。Free 组织可同时运行的项目数有限，create 被拒就先暂停/删除不用的项目（PRD §6.4） |
| 0.3 | Next.js 骨架 | `create-next-app@15`（TS、ESLint、App Router、**不选 Tailwind**）→ 手动装 `tailwindcss@3.4 postcss autoprefixer` 并 `tailwindcss init -p`（create-next-app 15 默认装 Tailwind 4，不符合 AGENTS.md）→ 手写 `components.json` + `tailwind.config.ts`（shadcn v3 结构）。shadcn 组件**不在 M0 装**，放到 D0 按 design system 引入（实测 `shadcn@2.3.0 add` 在非交互环境会卡住，D0 用逐个复制源码的方式兜底） |
| 0.4 | 依赖 | `@insforge/sdk zustand zod openai lucide-react shiki`；dev：`vitest` |
| 0.5 | scripts | `dev / build / start / lint / typecheck (tsc --noEmit) / test (vitest run) / deploy (npx @insforge/cli deployments deploy .)` |
| 0.6 | 数据库迁移 | `migrations/0001_init.sql`：PRD §5.4 全部表 + 索引（`messages(project_id, created_at)`、`usage_logs(user_id, created_at)`）+ `updated_at` 触发器 + RLS（见下）。用 `db migrations` 应用 |
| 0.7 | 认证配置 | `insforge.toml` 关闭邮箱验证 → `config plan` → `config apply` |
| 0.8 | AI 网关 | `ai setup` 开通 Model Gateway，拿到 OpenAI 兼容的 base URL 和 key（以 CLI 输出为准），确认 `anthropic/claude-haiku-5.5` 可用 |
| 0.9 | 环境变量 | `.env.example` 列全（见下表）；线上用 `deployments env set` |
| 0.10 | 压测路由 | `app/api/stream-test/route.ts`：`export const maxDuration = 300`，每秒推一条 SSE，共 150 条。部署后 `curl -N` 跑完，结论写进 README「关键取舍」 |
| 0.11 | CI | `.github/workflows/ci.yml`：Node 22 → `npm ci` → typecheck → lint → test → build（用占位环境变量） |
| 0.12 | 首次部署 | `npm run build` 通过后 `npm run deploy` |

**RLS 要点**（写进 0001）：

```sql
alter table projects enable row level security;
create policy own_projects on projects for all
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
-- messages / versions：通过父项目判断归属
create policy own_messages on messages for all
  using (exists (select 1 from projects p where p.id = project_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner_id = (select auth.uid())));
-- versions 同上；usage_logs 只能读写 user_id = (select auth.uid()) 的行
```

**环境变量清单**

| 变量 | 作用域 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_INSFORGE_URL` / `NEXT_PUBLIC_INSFORGE_ANON_KEY` | 公开 | 项目 URL 与 anon key（受 RLS 保护） |
| `INSFORGE_API_KEY` | 服务端 | admin key，只给 `/p/[slug]`、Discover、Remix 用 |
| `OPENROUTER_BASE_URL` / `OPENROUTER_API_KEY` | 服务端 | 指向 InsForge Model Gateway；以后换自带 OpenRouter key 只改这两项 |
| `OPENROUTER_CHAT_MODEL` | 服务端 | Alex 用；**开发期设为 `anthropic/claude-haiku-5.5`**，验收前切 `claude-sonnet-5.5` |
| `OPENROUTER_FAST_MODEL` | 服务端 | Mike / Emma / Bob 用 |
| `LLM_MOCK` | 服务端 | `1` = 回放 `fixtures/*.jsonl`，不调模型；本地默认 `1` |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | 服务端 | 体验账号，只在 Server Action 中使用 |
| `DAILY_LIMIT` / `DAILY_LIMIT_DEMO` | 服务端 | 默认 30 / 10 |

### 验收标准

- [ ] `curl -sI https://<slug>.insforge.site` 返回 200，页面显示 "Atoms Lite" 占位
- [ ] `curl -N https://<slug>.insforge.site/api/stream-test` 连续收到 150 条事件不断流 → **G1 通过**
- [ ] 5 张表已创建，`projects / messages / versions / usage_logs` RLS 开启
- [ ] `insforge.toml` 已提交，`config plan` 无漂移
- [ ] Model Gateway 用 Haiku 发一条 "ping" 能返回（花费可忽略）
- [ ] CI 首次运行绿

**降级**：shadcn 与 Tailwind 3.4 折腾超过 10 分钟 → 只用 Tailwind，弹窗等用 Radix 原件手写。压测断流 → 记录断流秒数，M2 直接把生成接口写成 Edge Function。

---

## D0 — Design system（0.5h，impeccable 流程）

**D0 结果（2026-10-10）**：界面语言定为**英文**；按 impeccable 流程先给了 4 个隐喻方向（厨房票轨 / 通告单 / 地铁线 / 机票夹），用户全部否决（"死板"），改为参照 OpenAI ChatGPT 与 Atoms 工作台的素净高级风格（canon 路线）。成品：`PRODUCT.md`、`DESIGN.md`、token（`app/globals.css`、`tailwind.config.ts`）、组件（`components/ui`、`components/workspace`）、样张 `/design-preview`；经 impeccable finish reviewer 两轮审查修复。本文后续出现的中文界面文案均以英文实现，语气按 DESIGN.md。

**要求（来自用户）**：UI 设计按 impeccable 推荐的流程走，**先出完整的 design system，再写任何页面**。风格不必沿用 Atoms 官网（PRD §4.3 的"紫→蓝渐变"等描述作废，以 DESIGN.md 为准），但必须**简洁、美观、直白**：

- 不写多余的文案：不要营销式口号、功能介绍段落、"AI 驱动"之类的空话；每个页面只留完成任务需要的字
- 不放无用的组件：不要装饰性卡片、假数据统计、无功能的徽章/图标、为了"看起来丰富"而加的区块
- 每个界面元素都要能回答"用户用它做什么"，答不出就删

### 任务

| # | 任务 | 细节 |
|---|---|---|
| D0.1 | 产品上下文 | `/impeccable init` → 生成 `PRODUCT.md`（用户、核心任务、语气：直白、少字；明确"不要什么"） |
| D0.2 | 视觉方向 | 按 impeccable 的 new-work 流程定视觉世界：工作台、Dashboard 属于 **Operate** 模式（可扫读、一致、少装饰）；首页属于 Persuade，但只有一个输入框和示例，不做营销长页 |
| D0.3 | Design system | 产出 `DESIGN.md`：色板（含明暗两套、4 个 Agent 角色色）、字体与字号阶梯、间距、圆角、阴影、动效原则、组件清单（按钮、输入框、Tab、对话气泡、Agent 卡片、文件树、工具栏、弹窗、Toast、空状态、错误条）及各状态（hover/focus/disabled/loading/error） |
| D0.4 | 落地 token | `app/globals.css` 的 CSS 变量和 `tailwind.config.ts` 改成 DESIGN.md 的 token；按清单引入需要的 shadcn 组件并改成这套样式，**清单之外的组件不引入** |
| D0.5 | 样张 | 临时页面 `/design-preview`（仅开发环境可访问；注意 App Router 里 `_` 开头的目录不会生成路由）展示全部组件和状态，明暗各截一张图；用 `/impeccable critique` 过一遍，修完再进入 M1 |

### 验收标准

- [ ] `PRODUCT.md`、`DESIGN.md` 已提交，DESIGN.md 覆盖上面列出的全部 token 和组件
- [ ] 代码里的颜色、圆角、阴影都来自 token，`git grep -nE "#[0-9a-fA-F]{6}" app components` 无硬编码色值（生成应用的 fixture 除外）
- [ ] 样张页明暗两种模式下文字对比度达到 WCAG AA
- [ ] critique 没有遗留的"多余文案 / 无用组件"类问题

### 之后每个做 UI 的里程碑（M1、M3、M4、M5、M6）都要遵守

- 写界面前先读 `DESIGN.md`，只用其中定义的 token 和组件；需要新组件时先补进 DESIGN.md
- 每个里程碑结束前用 `/impeccable critique`（或 `audit`）检查新页面，删掉多余文案和无用组件
- M6 打磨用 `/impeccable polish`，不再另起风格

---

## M1 — 账号 + 项目（1h）

**目标**：用户能进来、只看到自己的项目。

### 任务

| # | 任务 | 文件 / 细节 |
|---|---|---|
| 1.1 | SDK 封装 | `lib/insforge/client.ts`（浏览器）、`server.ts`（`@insforge/sdk/ssr`，httpOnly cookie）、`admin.ts`（`createAdminClient`，顶部 `import 'server-only'`） |
| 1.2 | 会话中间件 | `middleware.ts`：刷新会话；未登录访问 `/dashboard`、`/project/*` → 302 到 `/login?next=…` |
| 1.3 | 登录页 | `/login`：登录 / 注册两个 Tab；**体验账号**按钮调 Server Action（服务端用 `DEMO_*` 登录并写 cookie，密码不出服务端）；错误密码、邮箱已注册等提示 |
| 1.4 | 落地页 | `/`：大输入框 + 4 张示例卡（番茄钟、记账本、贪吃蛇、个人主页），点卡片**填入**输入框；空输入禁用提交。未登录提交 → prompt 暂存 `sessionStorage` → `/login?next=/` → 登录后回到首页并自动提交 |
| 1.5 | 新建项目 | `POST /api/projects {prompt}`：插入项目（标题取 prompt 前 24 字）+ 第一条 user 消息 → 跳到 `/project/{id}?autostart=1` |
| 1.6 | Dashboard | `/dashboard`：项目卡片（标题、相对时间、已发布徽标）；行内重命名；删除（确认弹窗）；空状态引导 |
| 1.7 | 项目详情 | `GET /api/projects/:id`：项目 + 消息 + 当前版本文件；不属于自己 → 404（不暴露存在性） |
| 1.8 | 工作台占位 | `/project/[id]` 只渲染标题和消息原文，M3 替换 |
| 1.9 | 退出登录 | 头像菜单 → 退出 → 回首页 |

> `profiles` 表 P0 不使用（显示名取邮箱前缀），保留表结构，不写注册钩子。

### 验收标准

- [ ] **T1** 未登录打开首页，落地页和示例卡正常；点示例卡填入输入框；空输入不能提交（F2 ②③）
- [ ] **T2** 新邮箱注册 → 不发验证邮件，直接进 Dashboard 并看到空状态（F1 ①、F3 ③）
- [ ] 体验账号 ≤ 2 次点击登录；DevTools 网络面板和页面源码里搜不到 `DEMO_PASSWORD` 的值（F1 ②）
- [ ] 刷新、关闭再打开浏览器后会话仍在；退出后访问 `/dashboard` 被重定向到登录页（F1 ③④）
- [ ] 错误密码、重复注册有明确提示（F1 ⑤）
- [ ] 重命名、删除后刷新保持；删除项目后其 messages/versions 级联删除（F3 ②）
- [ ] **T12** 账号 B 访问账号 A 的 `/project/{id}` 得到 404；B 在控制台用 SDK `from('projects').select()` 拿不到 A 的项目（F3 ④）

---

## M2 — 生成核心（1.5h）

**目标**：不写 UI，用脚本跑通 "prompt → 四个 Agent → 文件 → 入库"；做好 mock 回放，之后的开发不再消耗额度。

### 任务

| # | 任务 | 文件 / 细节 |
|---|---|---|
| 2.1 | LLM 客户端 | `lib/llm/openrouter.ts`：`new OpenAI({ baseURL, apiKey })`；导出 `streamChat()` / `completeJSON()`，统一处理 `signal`、`max_completion_tokens: 8000`、429 |
| 2.2 | 流式解析器 | `lib/parser/fileStreamParser.ts`：状态机 `push(chunk) → ParserEvent[]`、`end() → ParserEvent[]`；识别 `<file path="…">`、`</file>`、`<summary>`；标签外文本作为 Alex 的叙述 |
| 2.3 | 解析器单测 | 覆盖 7 类：①标签切在任意位置（逐字符 push 的结果 = 整段 push 的结果）②多文件 ③`path` 单/双引号 ④结尾未闭合 → 标记 `incomplete` ⑤标签外叙述文本 ⑥`<summary>` 提取 ⑦非法 path（`../x`、绝对路径） |
| 2.4 | 输出校验 | `lib/agents/validate.ts`：path 白名单 `^[\w-]+(/[\w-]+)*\.(html|css|js|json|svg|md)$`；合并后 ≤ 6 个文件、单文件 ≤ 100KB、必须有 `index.html`；不通过 → `error` 事件，不写版本 |
| 2.5 | Prompts | `lib/agents/prompts.ts`：Mike 输出 JSON `{brief, route: "full" \| "alex_only", title}`（Zod 校验，失败默认 `full`）；Emma 输出 3–6 条要点 Markdown；Bob 输出 JSON `{files:[{path,purpose}], notes}`；Alex 输出 `<file>` 块 + `<summary>`。Alex 的 system prompt 写明约束（入口 index.html、相对路径、CDN 白名单、只用 localStorage、≤ 6 文件）并附一个完整小例子 |
| 2.6 | 编排器 | `lib/agents/orchestrator.ts`：`async function* runPipeline(input, deps): AsyncGenerator<AgentEvent>`。`deps` 注入 `llm`、`signal`，**不 import 任何 `next/*`**。首轮 Mike→Emma→Bob→Alex；`alex_only` 跳过 Emma/Bob |
| 2.7 | **Mock 回放** | `lib/llm/mock.ts`：`LLM_MOCK=1` 时 `runPipeline` 不调模型，按原节奏（可加速）回放 `fixtures/{key}.jsonl`；按 prompt 关键词选 fixture（番茄钟/记账本/贪吃蛇/个人主页/暗色迭代/故意报错），找不到用默认 |
| 2.8 | **录制** | `RECORD_FIXTURE=name` 时把真实事件流写成 `fixtures/name.jsonl`。G2 后用 Haiku 录 4 份：番茄钟首轮、"改成暗色"迭代、贪吃蛇首轮、"调用不存在的函数"（给 E2 用） |
| 2.9 | 编排器单测 | 用 mock 断言：事件顺序、`alex_only` 路由、中途 abort 不产出 `version_created` |
| 2.10 | 持久化 | `lib/agents/persist.ts`：成功时 ①Alex 输出的文件合并到上一版本快照 ②插入 `versions`（`number = max+1`，撞唯一约束重试 1 次）③每个 Agent 一条 `messages`（`meta: {status, steps, files}`）④更新 `projects.current_version_id` ⑤写 `usage_logs`。失败/中止只写消息（`status: failed / stopped`），不写版本 |
| 2.11 | 路由 | `app/api/generate/route.ts`：鉴权 → Zod 校验 `{projectId, prompt, mode?: 'normal' \| 'fix'}` → 确认项目归属 → 当日限额（数 `usage_logs`，体验账号额度更低，超限 429；mock 调用不计数）→ `ReadableStream` 推 SSE；`request.signal` 透传给 LLM；每 15s 发 `: ping`；`maxDuration` 按 G1 设 |
| 2.12 | 冒烟脚本 | `scripts/smoke-generate.mjs`：用体验账号登录 → POST `/api/generate` → 逐行打印事件 → 结束时打印文件列表和版本号 |

### 验收标准

- [ ] `npm run test`：解析器 7 类 + 编排器 3 个用例全部通过
- [ ] `LLM_MOCK=1` 下跑冒烟脚本：事件按 `mike → emma → bob → alex` 出现，每个 `agent_start` 都有 `agent_end`，最后是 `version_created(number=1)` 和 `done`
- [ ] 真实调用（Haiku）跑一次冒烟：首个 `text_delta` 在 3 秒内到达（F4 ②）；完整生成 ≤ 120 秒
- [ ] DB：该项目有 1 个 version，`files` 含 `index.html`，`current_version_id` 指向它；4 条 Agent 消息、1 条 usage_log
- [ ] 第二次调用"改成暗色主题"：Mike 返回 `alex_only`，只出现 mike、alex；版本 2 中 Alex 没输出的文件与版本 1 一致（F7 ①③）
- [ ] 生成中 Ctrl+C 中断：服务端无未捕获异常，DB 无新版本，Alex 消息为 `stopped`（F8 ②）
- [ ] 让 LLM 返回非法内容（mock 一份坏 fixture）：收到 `error(retryable)`，没有新版本（F4 ⑥）
- [ ] 把 usage_logs 填到上限后调用，返回 429 和可读信息
- [ ] 4 份 fixture 已提交；本里程碑真实花费 ≤ $0.3

**降级**：Mike 的 JSON 不稳定 → 改用关键词规则路由（含"新增/页面/重做"走 full，否则 alex_only），Mike 只写 brief。Emma/Bob 拖慢首字节 → 两者并行调用。

---

## M3 — 工作台 UI（1.5h，全程 `LLM_MOCK=1`）

**目标**：浏览器里一句话生成番茄钟并且能玩。

### 任务

| # | 任务 | 文件 / 细节 |
|---|---|---|
| 3.1 | 预览拼装 | `lib/preview/buildPreviewHtml.ts(files, {inject})`：把 `<link href="style.css">`、`<script src="./app.js">` 换成内联内容；内联 JS 中的 `</script` 转义为 `<\/script`；找不到的引用保留原标签并产生一条 console warning；无 `index.html` 时返回兜底页；`inject: true` 时在 `<head>` 最前注入捕获脚本（`console.*`、`onerror`、`unhandledrejection` → `parent.postMessage({source:'atoms-preview', …}, '*')`） |
| 3.2 | 拼装单测 | 覆盖：`./` 与无前缀相对路径、缺失文件、`</script>` 转义、注入位置、无 index.html |
| 3.3 | 状态 | `lib/store/workspace.ts`（Zustand）：`messages`、`files`、`activeFile`、`activeTab`、`status: idle \| streaming \| stopping`、`consoleLogs`、`previewNonce` |
| 3.4 | SSE 客户端 | `lib/sse/readEvents.ts`：`fetch` + `ReadableStream` 按 `\n\n` 切分、解析 `data:`（POST 不能用 EventSource）；`AbortController` 支持停止 |
| 3.5 | 布局 | `/project/[id]`：服务端取数据 hydrate store；左 38% 对话、右 62% 面板；`< 768px` 时顶部 Tab 切换"对话 / 预览" |
| 3.6 | TopBar | 返回、可编辑项目名、当前版本号、Publish 按钮（M4 接通） |
| 3.7 | ChatPanel + AgentCard | 用户气泡；Agent 卡片：彩色头像、`Mike · Team Leader` 标签、状态（思考中/完成/失败/已停止）、Markdown 正文、可折叠 Activity（"Processed N steps"：`写入 index.html ✓`）、完成后的 Version card（`Version N: summary`）；失败卡片带"重试"。输入框生成中禁用，发送按钮变"停止" |
| 3.8 | CodePanel | 左侧文件树（生成中逐个出现，正在写的文件带动画点）；右侧内容：流式期间纯文本追加，`file_end` 后用 Shiki 高亮（避免每个 delta 重新高亮） |
| 3.9 | PreviewPanel | `<iframe sandbox="allow-scripts allow-forms allow-modals" srcdoc=…>`；工具栏：桌面/手机宽度、刷新（`previewNonce++`）、新标签打开（M4.4 接通，先禁用）、Console 抽屉（按 level 着色，可清空）。只接收 `event.source === iframe.contentWindow` 的消息 |
| 3.10 | 自动行为 | `?autostart=1` 且最后一条是未回复的用户消息 → 自动开始生成，然后用 `router.replace` 去掉参数；生成完成后切到 Preview 并刷新 |

### 验收标准

- [ ] `buildPreviewHtml` 单测全部通过
- [ ] **T3（mock）** 首页输入"做一个番茄钟，带今日完成次数统计" → 工作台自动生成 → 四张角色卡依次流式出现，带身份标签，Activity 可展开 → 完成后出现 Version card → 自动切 Preview → 计时器可开始/暂停（F4 ①③④、F6 ①）
- [ ] **T4** Code 标签：生成中文件逐个出现、内容实时增长；完成后有语法高亮，内容与预览一致（F5）
- [ ] 应用里的 `console.log` 和报错出现在 Console 抽屉（F6 ③）
- [ ] 生成中点"停止"：1 秒内停止，Alex 卡片显示"已停止"，输入框恢复可用（F4 ⑤）
- [ ] 刷新页面：消息、角色卡状态、Version card、预览全部恢复，且不会再次自动生成（F8 ①）
- [ ] 在 iframe 控制台执行 `parent.document`、`document.cookie`、`localStorage` 访问主站数据均失败（F6 ④）
- [ ] 关闭 mock、用 Haiku 真实跑一次 T3，结果与 mock 一致（本里程碑唯一一次真实调用）

**降级**：Shiki 有性能问题 → `<pre>` 无高亮。设备切换来不及 → 先只保留刷新和 Console。

---

## M4 — 迭代 + 发布（0.75h）→ **P0 完成**

**目标**：能在已有应用上继续改；能把应用安全地公开出去。

### 任务

| # | 任务 | 细节 |
|---|---|---|
| 4.1 | 多轮上下文 | 发给 Mike/Alex：当前全部文件 + 最近 6 条消息（Agent 消息只取摘要）；Alex 的 prompt 强调"只输出需要改动的完整文件，未输出的保持不变" |
| 4.2 | 发布 API | `POST /api/projects/:id/publish {slug}`：校验 `^[a-z0-9-]{6,30}$`、首尾不能是连字符、保留词（`api login dashboard discover admin …`）；写 `published_slug` 和 `published_version_id = current_version_id`；唯一约束冲突（23505）→ 409。`DELETE` 同路径 = 下线（两字段置空）。`GET /api/slug-available?slug=` 供输入时实时校验 |
| 4.3 | 公开页 | `app/p/[slug]/route.ts`：admin client 按 slug 取已发布版本 → `buildPreviewHtml(files, {inject:false})` + 右下角 "Made with Atoms Lite" 角标 → 返回 HTML，`Cache-Control: no-store`。**响应头必须带 `Content-Security-Policy: sandbox allow-scripts allow-forms allow-modals`**：发布页和主站同域，不加这条，生成的代码就能带着访客的登录 cookie 调 `/api/*`。不存在 → 404 页 |
| 4.4 | 新标签预览 | `app/preview/[id]/route.ts`：登录用户取自己项目的当前版本，输出方式同 4.3（同样带 CSP sandbox）；接通 3.9 的"新标签打开" |
| 4.5 | Publish 面板 | 弹窗：slug 输入（默认 `app-` + 6 位随机，实时校验）→ 发布 → "Your app is live!" + 复制链接 + 打开；已发布时显示链接、"更新到最新版本"（`current ≠ published` 时出现）、"下线" |
| 4.6 | 收尾 | 删除 `/api/stream-test`；Dashboard 卡片显示已发布徽标 |

### 验收标准（P0 完成的判定）

- [ ] **T5（mock + 真实各一次）** 发送"改成暗色主题，按钮再大一点" → 只有 Mike、Alex 参与；预览变暗色，计时仍可用；版本号 +1（F7）
- [ ] **T8** 发布，slug 填 `my-pomodoro` → "Your app is live!"，可复制链接（F9 ②）
- [ ] **T9** 隐身窗口打开 `/p/my-pomodoro`，未登录也能正常使用（F9 ③）
- [ ] 发布页控制台：`location.origin` 为 `"null"`，`fetch('/api/projects')` 拿不到数据
- [ ] slug 校验：`abc`（太短）、`Hello-World`（大写）、`-abcdef`（连字符开头）、`dashboard`（保留词）、已被占用的 slug 都有对应提示（F9 ①）
- [ ] 改出新版本后"更新到最新版本"，公开链接展示新内容；"下线"后链接返回 404 页（F9 ④⑤）
- [ ] **T11** 退出 → 重新登录 → 换一个浏览器打开项目：聊天记录、代码、版本号全部恢复（F8 ①）
- [ ] 生成中途刷新页面，项目数据不损坏，最多丢失本轮（F8 ②）
- [ ] PRD §7.1 F1–F9 全部打勾 → **P0 完成**；记录实际用时，执行 **G3**

---

## M5 — P1 延展（1h）

按顺序做，每项限时；超时立即按"降级"收尾、提交、部署，进入下一项。前两项完成即满足 PRD "P1 至少 2 项"。

### E2 Issue Report + Resolve（25 min）

| 任务 | 细节 |
|---|---|
| 错误汇总 | 复用 3.1 注入的捕获脚本；store 里按 `message` 去重计数 |
| Issue Report | 预览区左下角浮层："⚠ 发现 N 个运行时错误"，按钮 **Resolve** / **查看 Console** / 忽略 |
| 修复流程 | Resolve → `/api/generate {mode:'fix'}`，prompt 附去重后的前 5 条错误和堆栈；`fix` 模式跳过 Emma/Bob，Mike 只写一句 brief |
| 防循环 | 不自动触发，只能手动点；新版本加载后清空错误列表 |

验收：
- [ ] **T7（先用"故意报错" fixture，再真实跑一次）** 发送"加一个按钮，点击时调用一个不存在的函数" → 点击后 2 秒内弹出 Issue Report 并显示错误信息 → Resolve → 生成新版本，再点击不报错（E2 ①②③）
- 降级：只显示错误条 + Resolve，不做浮层动画和去重

### E1 版本历史 + Restore + Revert（25 min）

| 任务 | 细节 |
|---|---|
| Versions 标签 | 列表：`vN`、summary、相对时间、"当前"/"已发布"徽标 |
| 预览历史版本 | 点某版本 → 预览和 Code 切到该快照（只读，顶部提示"正在查看 v2 · 返回当前"），不改变当前版本 |
| Restore | `POST /api/projects/:id/restore {versionId}` → 复制快照为新版本，summary = `Restored from vN`，历史不删 |
| Revert | Agent 消息的 Version card 上加 Revert = Restore 到该消息**之前**的版本 |

验收：
- [ ] **T6** v1→v2 后 Restore v1 → 预览回到亮色；生成 v3 且内容与 v1 一致，v1/v2 仍在列表（E1 ①③）
- [ ] 预览 v1 时 TopBar 的当前版本号不变（E1 ②）
- [ ] 在 v2 的消息上点 Revert → 生成新版本 = v1 内容（E1 ④）
- [ ] Restore 后继续对话，Alex 基于恢复后的版本修改
- 降级：去掉"预览历史版本"，只保留 Restore

### E3 Discover + Remix（20 min）

| 任务 | 细节 |
|---|---|
| Discover | `/discover`：服务端用 admin client 只查 `title, published_slug, updated_at`（不暴露 owner 和文件）；卡片进入 `/p/{slug}` |
| Remix | `POST /api/projects/:id/remix`：校验源项目已发布 → 用已发布版本新建项目（`remixed_from`），新项目 v1 = 该快照，不复制聊天记录；发布页角标的 "Remix" → 未登录先登录，登录后自动 Remix 并跳到新工作台 |

验收：
- [ ] 账号 A 发布的应用出现在 Discover；下线后消失（E3 ①）
- [ ] 账号 B 点 Remix → 得到含代码、不含聊天记录的副本，可继续对话；A 的项目不受影响（E3 ②）
- 降级：去掉 Discover 页，只保留发布页上的 Remix

### E6 主题预设（10 min）

- `lib/themes.ts` 定义 5 个预设（配色 + 字体 + 圆角风格）；首页和对话输入框旁加选择器；选中后作为约束拼进 Mike/Alex 的 prompt
- 验收：[ ] 同一 prompt 选两个对比强烈的主题，生成结果的配色/字体明显不同（E6）

### E4 / E5

只有前四项都完成且累计用时 < 7h 才做；否则写进 README 后续规划。

---

## M6 — 打磨（0.5h）

| 类别 | 检查项 |
|---|---|
| 状态 | Dashboard 空状态；工作台首次加载骨架；生成失败卡片 + "重试"；网络断开提示；429 提示"今日额度已用完（体验账号 10 次/天），明天再来或注册账号"；网关额度耗尽时同样友好提示 |
| 视觉 | 用 `/impeccable polish` 按 DESIGN.md 过一遍首页、Dashboard、工作台、Publish 弹窗；再查一遍有没有多余文案和无用组件；角色颜色在明暗模式下都可读 |
| 移动端 | 375px：首页、登录、Dashboard、工作台 Tab、发布页均无横向滚动 |
| 可访问性 | 图标按钮有 `aria-label`；弹窗可 Esc 关闭、焦点不丢 |

验收：
- [ ] **T13** 375px 下工作台对话/预览可切换，工作台和发布页无横向滚动
- [ ] 断网后发起生成 → 卡片显示失败并可重试；恢复网络后重试成功
- [ ] 超过每日次数时前端给出明确提示而不是报错（7.4 成本控制）
- [ ] 主站各页面浏览器 Console 无报错；Dashboard 首屏 ≤ 2 秒（7.4 性能）

---

## M7 — 交付（0.5h）

| 任务 | 细节 |
|---|---|
| 切模型 | 线上 `OPENROUTER_CHAT_MODEL` 切回 `claude-sonnet-5.5`，`LLM_MOCK` 关闭；执行 **G4** |
| 示例 | 用体验账号生成并发布 3 个应用（番茄钟、记账本、贪吃蛇），体验账号里保留这几个项目（T10 要求能看到示例项目），链接写进 README |
| README | 介绍、在线地址、体验账号说明、GIF（首页→生成→预览→发布）、本地运行（含 `LLM_MOCK=1` 免费跑通）、环境变量表、架构图、关键取舍（iframe srcdoc vs Sandpack、快照 vs diff、XML 标签 vs JSON、Route Handler vs Edge Function + G1 结论、CSP sandbox、Mock 优先）、完成度表、T1–T13 结果、后续规划 |
| 保活 | Free：配置 InsForge schedule 每天请求一次站点；或升级 Pro |
| 自查 | 运行 `code-review`；`git grep` 检查密钥；`.env.example` 与代码里读取的变量一致 |
| 收尾 | 线上跑完 T1–T13（T3 连跑 3 次，至少成功 2 次）；`git tag v1.0`；填写题目文档「笔试结果回收」并发给 HR（截止 2026-10-12） |

验收：
- [ ] **T10** 体验账号一键登录，能看到示例项目
- [ ] T1–T13 线上全部通过，结果记录在 README
- [ ] PRD §7.5 提交验收、§8 交付物清单全部打勾
- [ ] 在干净目录 `git clone` 后按 README 用 `LLM_MOCK=1` 能跑起来

---

## 1. 测试计划

| 层 | 对象 | 何时 | 工具 |
|---|---|---|---|
| 单测 | `fileStreamParser`（7 类）、`validate`、`buildPreviewHtml`（5 类）、slug 校验 | M2 / M3 / M4 | Vitest |
| 编排测试 | `runPipeline` + mock：事件顺序、路由、abort | M2 | Vitest |
| 冒烟 | `scripts/smoke-generate.mjs`（默认 mock，`--real` 才真实调用） | M2 起每次部署后 | Node |
| 线上 E2E | PRD §7.3 T1–T13 | 各里程碑跑对应用例，M7 全量 | 浏览器 + 隐身窗口 |

不写 Playwright 自动化 E2E：8 小时内维护成本高于收益，且生成结果本身不确定。用"纯函数单测 + mock 回放 + 线上冒烟 + 固定手工用例"覆盖。

## 2. T 用例在各里程碑的分布

| 里程碑 | 首次通过的用例 |
|---|---|
| M1 | T1、T2、T12 |
| M3 | T3（mock + 一次真实）、T4 |
| M4 | T5、T8、T9、T11 |
| M5 | T7（E2）、T6（E1） |
| M6 | T13 |
| M7 | T10，并全量回归 T1–T13 |

## 3. 真实 LLM 调用预算（$1 Free 额度）

| 阶段 | 调用 | 模型 | 预计花费 |
|---|---|---|---|
| M0 | 网关连通 ping | Haiku | ≈ $0 |
| M2 | 录 4 份 fixture + 1 次冒烟 | Haiku | ≈ $0.03 |
| M3 | T3 真实验证 1 次 | Haiku | ≈ $0.01 |
| M4 | T5 真实验证 1 次 | Haiku | ≈ $0.01 |
| M5 | T7 真实验证 1 次 | Haiku | ≈ $0.01 |
| M7 | T3×3 + T5 + 3 个示例 | Sonnet | ≈ $0.7 |
| **合计** | | | **≈ $0.76**，剩余留给评审；不够就执行 G4 |

## 4. 风险触发条件

在 PRD §6.4 基础上补充"什么信号出现时启动应对"：

| 风险 | 触发信号 | 动作 |
|---|---|---|
| 函数超时 | G1 压测断流，或线上生成总在固定秒数中断 | 编排器平移到 Edge Function（只换路由层） |
| 生成代码质量差 | 真实调用中预览白屏 | 收紧 prompt、增加示例；把这次输出存成 fixture 复现；优先做 E2 |
| 解析错乱 | 文件内容串到另一个文件 | 把原始输出存成单测 fixture，先修再继续 |
| 额度提前耗尽 | 网关返回 429 / 额度不足 | 全面切 mock 继续开发；G4 提前执行 |
| M2/M3 超时 | 累计用时超计划 30 分钟 | 压缩 M5（只做 E2 + E1 Restore）；仍不够则 G3 提前生效 |
| 部署失败 | `deployments status` 报错 | 本地 `npm run build` 复现；用 `deployments env` 核对环境变量 |

## 5. 进度记录

| 里程碑 | 计划 | 实际用时 | 真实 LLM 花费 | 线上通过的用例 | 备注 |
|---|---|---|---|---|---|
| M0 | 0.75h | ≈0.6h | <$0.001（网关 ping） | 站点 200、150s 流式、RLS、CI | G1：✅ 150 条事件逐秒实时到达，生成接口留在 Route Handler |
| D0 | 0.5h | ≈1.2h | $0 | 样张 light/dark/375 截图、detector 0 findings、reviewer 两轮 | 用户否决首轮方向，改 OpenAI/Atoms 风格 |
| M1 | 1h | ≈0.5h | $0 | 未登录→登录→自动建项目、重命名持久化、RLS 9/9（scripts/check-rls.mjs） | 用 server actions 代替 /api/projects 路由 |
| M2 | 1.5h | ≈1h | ≈$0.04（Haiku 录 5 个 fixture） | 47 单测；mock/真实冒烟；中止不写版本；429；线上冒烟 | Mike 改为流式 header；fixture 是按 agent 的原始输出（JSON），不是事件流 |
| M3 | 1.5h | ≈1h | $0 | T3（mock）、T4、Console 报错、Stop、刷新恢复、375 Chat/App | sandbox 下 localStorage 不可用 → 注入 shim 并由父页按项目持久化 |
| M4 | 0.75h | ≈0.6h | $0 | scripts/check-publish.mjs 13/13；匿名访问 /p/{slug}、父页读不到 iframe（opaque origin）、更新到最新、下线 404 | /p/{slug} 改为可信外壳 + 沙箱 iframe（同 workspace 的 storage 桥），不再用 CSP sandbox 响应头；G3：P0 完成，用时约 5.7h |
| M5 | 1h | ≈0.7h | $0 | E2 Issue Report→Resolve→新版本；E1 查看历史版本/Restore/Revert；E3 Discover（实时缩略图）+ Remix；E6 5 个主题预设 | E6 只放在首页输入框（迭代时直接用文字描述即可）；Resolve 的真实修复效果留到 M7 用真实模型验证 |
| M6 | 0.5h | 与 M7 合计约 0.3h | 本地 mock 检查 $0 | 375/1280 明暗、离线重试、429、62 单测、CI、部署 | 修复输入丢失、EOF、发布网络反馈、hydration、截断假成功；见 RELEASE-2026-10-10.md |
| M7 | 0.5h | 与 M6 合并记录 | 真实网关增量见验收记录 | T1–T13、3 个真实示例、Paper/Midnight、真实 Resolve | G4：生产全 Haiku、mock 关闭；余额未返回，不能承诺剩余次数；每日访问任务已启用待首跑 |


## 6. 当前部署之后的实施计划（新增，均待验收）

### 6.1 基线与顺序

本节执行用户新增需求，依据 PRD §3、§7.6、[实现审计](IMPLEMENTATION-AUDIT-2026-10-10.md)、[官方对标](ATOMS-OFFICIAL-FEATURES-2026-10-10.md) 和 [视觉素材方案](VISUAL-ASSET-PLAN.md)。原 M0–M7 与 8 小时预算保留；以下是额外工作，不回填为已完成，也不把当前代码存在等同于线上通过。

**进入条件：**当前发布完成，记录 Git SHA、部署 URL、mock/真实模型模式、T1–T13 结果和未关闭问题；M7 未结束则先结束原交付。基线审计时 E1/E2/E3/E6 已有代码，M6 有样式提交，仍以进度表与线上验证为准。若现有部署仍包含核心失败，先修复，不带病增加亮点。

执行顺序：`当前部署与 M7 → M8 可靠性 → M9 检查 → M10 引用与 Diff → M11 导出 → M12 元素选择 → M13 头像 → M14 增量验收`。素材方案与离线候选可以提前准备，接入放在核心可靠性之后。每个里程碑独立提交并部署验证；Git、部署和验收记录对应同一版本。

| 里程碑 | 产出 | 依赖 | 验收 | 粗估投入（非承诺） |
|---|---|---|---|---|
| M8 | 审计问题关闭及故障回归 | 基线发布 | T14 | 0.5–1.5 工日 |
| M9 | N1 实际检查结果与发布核对 | M8 | T15 | 0.5–1 工日 |
| M10 | N2 文件引用、N3 版本 Diff，分开提交 | M8、M9 的版本契约 | T16、T17 | 1–1.5 工日 |
| M11 | N4 源码 ZIP | M8 的可靠快照 | T18 | 0.5 工日 |
| M12 | N5 点选上下文 | M9 会话桥、M10 引用 | T19 | 0.5–1 工日 |
| M13 | V1 四头像与生产素材清单 | M8；先选稿后接入 | T20 | 0.5–1 工日，含选稿 |
| M14 | 全量回归、README、增强发布记录 | M9–M13 | T21 | 0.5 工日 |

估算约 4–7 工日，用于安排顺序；需要在 M8 确认并发保存方案、M13 确认样张后修正。若交付时间不足，先完成 M8–M9，再交付 N2/N3/N4；N5/V1 顺延并明确记录。旧 $1 模型预算不涵盖本节；沿用 mock 开发，真实验收前核对剩余额度，不能将生图额度和 InsForge LLM 额度混算。

### M8 — 可靠性基线（先复核，再修仍存在的问题）

- [x] 逐项复核审计 A1–A6，给出复现、已修复或仍存在的证据；避免覆盖并行开发者已完成的修复。
- [x] A1：后端完成事件传递最终文件/版本标识，客户端成功后采用服务端权威快照；截断的 draft 不进入成功文件集。验证刷新前后内容一致。
- [x] A2：设计一次生成的原子提交（版本、当前指针、消息、用量），使用数据库事务函数或等效可靠提交方案；需要 schema/RPC 时先读 InsForge 技能、经 migrations 落地。请求标识唯一，重复提交不产生第二版本；并发以预期当前版本校验，冲突不能覆盖最新结果。
- [x] A3/A4：保存请求输入与引用用于同一次重试；显式处理没有终止事件的 SSE EOF，提供可见错误和重试；停止、失败和成功互斥。
- [x] A5：项目、版本、消息数据库读取都检查 error；不存在与读取失败分开处理，失败不默认空项目。
- [x] A6：slug 检查和下线请求的网络失败均恢复可操作状态并显示错误。
- [x] 修复 edit-fix fixture，确认实际消除 edit-broken 的错误；检查公开示例，坏示例先修复并重新验证，不把“有发布记录”当作可用。

**主要入口：**`lib/agents/persist.ts`、生成路由及状态 hook、项目读取、`publish-dialog.tsx`、fixtures；定位以实施时当前代码为准。

**验证：**保留最小有意义的截断、持久化故障、重复请求、并发冲突、前置失败重试、EOF 和读取失败回归；补运行真实浏览器复核。T14 通过并记录新的部署 SHA 后才进入 M9。迁移采用向后兼容新增方式，先验证再切调用方，保留应用回滚能力。

### M9 — N1 轻量检查与发布证据

- [x] 提取纯函数静态检查器：入口、文件路径与限制、HTML/CSS 本地引用；对无法静态解析的动态资源明确标为未检查，不误报通过。
- [x] 定义检查记录：版本 ID、内容摘要、检查种类/结果/时间；服务器结果与浏览器会话观察分开。存储若新增表/列则带迁移、所有权策略和回归。
- [x] 扩展 `buildPreviewHtml` 与父页桥，接收 ready/error，绑定预览会话并按 PRD 的 10 秒启动、3 秒观察规则展示。新版本/切换预览清空旧会话状态。
- [x] 工作台增加紧凑检查摘要，链接到实际问题；沿用 Resolve。服务端发布路由检查确切待发布版本，并防止检查与指针更新之间的版本竞争。
- [x] 写清错误、未执行、超时、观察无错误的区别，不宣称浏览器观察能证明业务功能正确。

**验证/交付：**静态检查纯函数用例 + 固定 runtime error/timeout fixture，T15；不伪造测试日志。提交 `feat: add version-bound preview checks`，构建、部署和线上检查。

### M10 — N2 文件引用与 N3 版本 Diff

**先文件引用，后 Diff；两个可独立验收的提交：**

- [ ] 在 Code 文件项加“加入聊天”，输入区展示可移除引用；为消息结构和保存格式补引用字段，旧消息兼容空引用。
- [ ] 生成入口校验用户、项目、版本和路径；有版本冲突则不调用模型。将选定文件作为结构化上下文给 Alex，沿用 M8 请求标识与重试。
- [ ] 版本面板加入文件级摘要，按需展开文本 Diff；默认所选版本对前一版，首版全新增。选择文本 Diff 依赖前比较体积和现有项目能力，不为此引入完整编辑器。
- [ ] 明确显示当前、查看中、已发布标记；长内容折叠，移动端可切换文件；读历史不触发 Restore。

**主要入口：**Code view、消息输入/展示、生成请求契约、版本列表与详情；Diff 计算从不可变 snapshots 派生，避免新增重复真源。

**验证/交付：**T16 越权/过期引用/重试，T17 文件变化样例；各自构建部署。无需为了 Diff 改生成协议支持文件删除，展示按实际快照比较即可。

### M11 — N4 源码 ZIP

- [ ] 新增所有者导出接口，拟定 `GET /api/projects/:id/export?versionId=...`；版本参数明确，服务端验证版本归属，错误不回退导出其他版本。
- [ ] 选择维护中的 ZIP 库并核对压缩体积，逐项验证归档路径；基于原始 snapshot 构建，绕过预览拼装与注入。
- [ ] 在 Code/版本详情放导出入口，显示版本与下载状态；附运行说明和依赖边界，说明文件名冲突不覆盖生成文件。
- [ ] 响应使用附件下载与私有不缓存策略；文件名净化，错误返回可读状态。

**验证/交付：**T18，解压比对文本内容、危险路径拒绝、他人项目不可导出；本地 HTTP 打开固定样例。构建部署后从线上下载验证。

### M12 — N5 点选元素加入聊天

- [ ] 给预览桥增加选择开关、高亮、选中和退出消息；验证父子窗口来源、会话、版本与 payload，限制事件频率。
- [ ] 仅选择模式阻止普通点击，Esc/退出恢复交互；悬浮框属于注入辅助层，不修改快照源码。
- [ ] 选中后展示可移除的标签/文本上下文，与 N2 文件引用共同进入请求；服务端限长并把选中内容当作生成应用数据，不当作平台指令。
- [ ] 保持 iframe opaque origin，绝不增加 allow-same-origin；不读取输入值和存储。动态节点无法准确定位源码时提示这是修改线索。
- [ ] 当前版本改变、历史查看或预览重载时清除选择，避免错改。

**验证/交付：**T19 桌面及 375px 点选链路、Esc、表单数据排除、旧会话事件拒绝；真实迭代一次确认改动，再构建部署。失败可禁用选择入口，普通预览/聊天必须继续工作。

### M13 — V1 原创素材生成与上线

详细操作和四份提示词见 [VISUAL-ASSET-PLAN.md](VISUAL-ASSET-PLAN.md)。

- [ ] 将 DESIGN 中 monogram 规则扩展为“原创头像 + 字母回退”，保留角色色与 24/32px 尺寸；更新样张页。
- [ ] 使用 Codex 内置 image_gen 先生成 Mike，检查真实聊天尺寸后作为另外三位的风格参考；透明背景，原创角色，无烘焙文字。选稿是质量判断，不视为已上线。
- [ ] 原图与提示词存 `design-assets/agents/v1/`；上线衍生图存 `public/assets/agents/`；补 `docs/assets-manifest.json`，记录来源、路径、尺寸、体积与状态。
- [ ] 目标 96px 透明 WebP、每枚 ≤20KB/四枚 ≤80KB；PRD 最大验收预算为 ≤30KB/≤120KB。若需标准压缩工具，明确开发依赖并保留 alpha；不让生成临时目录成为网站依赖。
- [ ] 接入 `AgentAvatar`，固定尺寸、空 alt（旁边已有身份文字）、图片失败字母回退；Logo 和 UI 保持 SVG/真实组件。可选空态/分享图独立提交，不阻塞四头像。
- [ ] 构建部署，逐个确认线上资源 200、内容类型、体积，工作台深浅色/375px/慢网/404 无跳动。只有此时将 manifest 标为 deployed 并填 URL。

**验证/回退：**T20；回退组件/素材路径即可，无需新图床或数据库。只生成图片不算完成此里程碑；不新增用户在线生图功能、计费或 Storage 流程。

### M14 — 增强版验收与交付记录

- [ ] 全量运行现有测试、lint、类型检查和 build；部署后 T1–T13 回归，加 T14–T20 增量验收。
- [ ] 用真实模型跑一条生成→引用/点选迭代→检查→Diff→导出→发布链路；mock 与真实结果分开写，运行时无报错不替代功能操作验收。
- [ ] README 更新当前能力、运行说明、截图、公开演示、限制和成本边界；PRD/PLAN 勾选只依据证据。
- [ ] 记录增强版 SHA、URL、时间、环境模式、验收结果与剩余问题；公开示例逐个可操作。T21 完成才宣布增强版交付。

### 6.2 新增进度记录

| 里程碑 | 状态 | SHA / 部署 URL | 验收证据与未解决问题 |
|---|---|---|---|
| 当前部署基线 / M7 | 待核对发布与验收记录 | 待填 | 不用本次文档更新推定线上完成 |
| M8 | 已完成并部署 | `5e63a32` / `450fcf2e` | T14 通过；见 ENHANCEMENTS-2026-10-10.md |
| M9 | 实现及本地验收完成，线上待复核 | 本次检查功能提交 | T15 五组浏览器用例通过 |
| M10 | 待实施 | — | T16、T17 |
| M11 | 待实施 | — | T18 |
| M12 | 待实施 | — | T19 |
| M13 | 待实施 | — | T20；当前只完成素材方案 |
| M14 | 待实施 | — | T21 |
