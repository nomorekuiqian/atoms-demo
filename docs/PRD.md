# Atoms Demo — PRD & Engineering Plan

> 版本 v1.4 · 2026-10-10（新增部署后增强 N1–N5、原创素材 V1 与增量验收；原始交付范围和预算保留）
> 目标：在 6–8 小时内交付一个**可上线、可注册、可生成并预览应用、数据持久化**的 Atoms 风格 AI Agent 应用生成平台。
> 工作名：**Atoms Lite**（可替换）

---

## 0. 一句话定义

用户用自然语言描述一个想要的 Web 应用，一支由多个 AI 角色组成的"虚拟团队"（Team Leader → 产品经理 → 架构师 → 工程师）以可视化、流式的方式协作，生成可运行代码，并在右侧实时预览；用户可以继续对话迭代、回滚版本，并一键发布成公开链接分享给别人。

---

## 1. 项目背景（Context）

### 1.1 题目来源

这是 Atoms（https://atoms.dev ，MetaGPT 团队的下一代 AI Agent 平台）的笔试题：在 6–8 小时内完成一个属于自己的 "Atoms Demo"。题目明确**不考察是否"用 Atoms 做 Atoms"**，而是看如何借助 AI 工具，把想法快速变成一个**可运行、可体验、可扩展**的产品原型。

| 项 | 内容 |
|---|---|
| 收到任务 | 2026-10-10 |
| 提交截止 | 收到后 48 小时内，即 **2026-10-12** |
| 建议投入 | 一段完整的 6–8 小时专注开发 |
| 工具 | 不限（本项目使用 Claude Code / Codex）；Atoms 平台可作参考，官方提供 $70 额度（需短信向 HR 申请） |
| 参考资料 | Atoms 文档站（support.mgx.dev，现为 help.atoms.dev） |
| 提交方式 | 复制题目文档 → 在「4. 笔试结果回收」处填写**在线 Demo 链接**和 **GitHub 源码链接**（均需 public）→ 把文档链接发给对接 HR |
| 建议附带 | 简要说明文档：实现思路与关键取舍、当前完成程度（做了/没做）、继续投入时的扩展方向与优先级 |

### 1.2 题目硬性要求 → 本方案的对应

| # | 题目要求 | 本方案如何满足 | 对应功能 |
|---|---|---|---|
| R1 | 可运行的网页应用，具备类似 Atoms 的能力与 UI 交互体验 | Atoms 风格工作台：左侧团队对话，右侧预览/代码/版本 | F4–F6，4.2 |
| R2 | 通过智能体驱动的方式完成代码（应用）生成 | Mike → Emma → Bob → Alex 多 Agent 流水线，真实调用 LLM 生成代码 | F4 |
| R3 | 生成的应用以可视化网页形式展示 | 沙箱 iframe 实时预览 + 发布后的公开网页 | F6、F9 |
| R4 | 具备真实交互（而非纯静态展示） | 登录、建项目、对话生成、迭代、回滚、发布全部可操作；生成的应用本身也可交互 | F1–F9 |
| R5 | 具备数据持久化 | InsForge Postgres 存用户、项目、消息、版本；刷新/换设备后可恢复 | F8 |
| R6 | 覆盖基本使用流程（初始化 / 注册 / 核心主流程） | 注册或体验账号 → 新建项目 → 生成 → 预览 → 迭代 → 发布 | F1–F9 |
| R7 | 至少一个延展或衍生能力 | 计划至少完成 2 个：Issue Report + Resolve、版本恢复（另有 Discover/Remix、主题预设） | E1–E6 |
| R8 | 可测试的在线访问链接 | InsForge Sites 部署，`*.insforge.site`；提供体验账号 | 第 8 节 |
| R9 | 实际可用的功能，而不仅是概念验证 | 真实模型生成、真实数据库、真实发布链接；线上 E2E 验收（第 7 节）通过才算完成 | 第 7 节 |
| R10 | GitHub 源码公开 | `nomorekuiqian/atoms-demo`（public） | 第 8 节 |

### 1.3 评估维度拆解

| 评估维度 | 我们用什么来证明 |
|---|---|
| 完成度 | 注册 → 创建项目 → 生成 → 预览 → 迭代 → 发布 全链路可用；线上稳定 |
| 工程思维 | 本文档的范围取舍（P0/P1/P2）、简单可控的技术选型、清晰的模块边界、按里程碑提交的 Git 历史 |
| 用户体验 | 流式输出 + Agent 角色时间线，等待过程"可见"；双栏工作台；空状态/错误状态完整 |
| 创新性 | ①多 Agent 可视化协作 ②预览报错 Issue Report + Resolve 修复闭环 ③点选预览元素定向修改（N5） ④版本绑定验收契约、行为观察与退化修复（N6–N9） |
| 可交付性 | 在线链接 + GitHub + README（实现思路、取舍、完成度、后续规划） |

**非目标**（明确不做）：真实后端代码生成与部署（生成应用只做纯前端）、多人实时协作、计费系统、自建沙箱容器、移动端原生 App。

### 1.4 当前进展与已定决策（2026-10-10）

| 项 | 状态 |
|---|---|
| 后端 + 部署 | ✅ 全部使用 InsForge（DB / Auth / Model Gateway / Sites）；项目已创建并已有部署；当前发布版本与验收证据以 PLAN 进度记录为准 |
| GitHub | ✅ 公开仓库 `nomorekuiqian/atoms-demo` 已建，PRD 与协作约定已推送 |
| 模型 | ✅ Alex：`anthropic/claude-sonnet-5.5`；Mike/Emma/Bob：`anthropic/claude-haiku-5.5`（经 OpenRouter） |
| 开发工具 | ✅ Claude Code（已装 insforge、frontend-design、impeccable、modern-web-guidance 等 Skill/插件） |
| AI 额度方案 | ✅ 先用 InsForge 现有的 AI 额度（Free 计划 $1），按 6.0「省额度策略」开发；不够时再升级 Pro 或换自带 OpenRouter key（只改环境变量） |

### 1.5 Atoms 对标分析（来源：atoms.dev、atoms.dev/llms-full.txt、help.atoms.dev 帮助中心，2026-10 查阅）

**Atoms 的定位**：不是"网页生成器"，而是"多 Agent 的 AI 业务团队"——调研 → 规划 → 构建 → 发布 → 增长 → 迭代的完整产品闭环。Agent 阵容：Mike（Team Leader）、Emma（PM）、Bob（架构师）、Alex（工程师）、David（数据分析）、Iris（深度调研）、Sarah（SEO）、Adrian（广告）。

| Atoms 能力（官方叫法） | Atoms 的做法 | 本 Demo 的对应 | 取舍 |
|---|---|---|---|
| Project Chat + Team Leader | Mike 先把需求写成 brief，再 @ 指派给专家（通常是 Alex）；每条回复有身份标签"Mike \| Team Leader" | **Mike 编排**：写 brief → 指派 Emma/Bob/Alex；角色卡带身份标签 | ✅ P0，核心体验 |
| Activity card "Processed N steps" + 工具卡 | 可展开查看每步叙述和工具调用（读文件、写代码、跑命令） | 角色卡内可折叠的步骤列表：`写入 index.html`、`写入 app.js`… | ✅ P0 |
| Version card | 每次任务完成生成"Version N: 名称"卡片，钉在消息上 | 每次生成落库一个版本，消息底部显示版本卡 | ✅ P0 |
| 消息操作 | Revert（回滚到该消息之前）、Copy、点赞/点踩 | Revert + Copy | ✅ P1（E1） |
| Stop & continue | 中途停止保留已完成部分，补充需求后从当前状态继续 | 停止按钮；已完成的文件保留为草稿版本 | ✅ P0（停止）/ P1（保留草稿） |
| 消息排队 | Agent 忙时用户消息进入队列，可编辑/删除/排序 | 忙时消息进入队列（只做顺序执行 + 删除） | ⏳ P1（E5） |
| Issue Report + Resolve | 出错时左下角弹通知，一键 Resolve 让 AI 修复，可展开看日志 | iframe 报错回传 → 错误条 + **Resolve** 按钮 → Alex 修复 | ✅ P1（E2），沿用 Atoms 叫法 |
| App Viewer | 工具栏：Design、设备切换、刷新、Home、页面选择、新标签打开、**Console** | 预览工具栏：设备切换、刷新、新标签打开、**Console 面板**（显示 iframe 日志/报错） | ✅ P0（Console 成本低、加分） |
| Editor | 文件树 + 编辑；编辑会话 Submit all / Discard all；可把文件 # 引用进聊天 | Code 标签只读 → P1 可编辑并保存为新版本 | ⏳ P1（E4） |
| Versions / Restore / Remix | 版本卡片可预览、Restore（之后的改动保留在历史里）、Remix 成新项目 | Versions 标签：预览、恢复（=新建版本）、Remix | ✅ P1（E1、E3） |
| Publish | `[name].pub.atoms.world`，名字 6–30 位小写字母/数字/连字符；发布前安全扫描；可下线 | `/p/[slug]`，slug 可编辑，规则同 Atoms；发布成功弹窗"Your app is live!"；可下线 | ✅ P0（F9） |
| Share / Discover | 项目设为 Public 后可通过链接和 Discover 广场访问 | Discover 广场（展示已发布应用）+ Remix | ⏳ P1（E3） |
| Design（Theme / Visual Editor） | 14 个主题预设；点选预览元素直接改 | 首页输入框选**主题预设**（拼进 prompt）；点选元素作为对话上下文 | 主题 P1（E6）/ 点选部署后 N5 |
| Race Mode | 同一需求多个模型并行生成，择优 | — | ❌ P2 |
| Atoms Cloud | 给生成的应用提供数据库/用户/存储/密钥/AI | 给生成应用提供一个简易 KV 数据接口（存在我们的 InsForge 里） | ❌ P2 |
| Deep Research / SEO / Ads / Data Analyst | Iris、Sarah、Adrian、David | — | ❌ 不做，README 写为规划 |

**结论**：Demo 聚焦 Atoms 最核心的"**对话 → 团队协作生成 → 预览 → 版本 → 发布**"闭环，并在交互细节上对齐 Atoms 的叫法和心智（Team Leader 编排、Activity card、Version card、Issue Report/Resolve、App Viewer Console、Publish/Share 分离），让评审一眼看出"懂这个产品"；增长类 Agent 和 Atoms Cloud 这类重能力明确不做，写进规划。

---

## 2. 用户与核心场景

- **目标用户**：非工程背景的创作者 / PM / 学生，想快速做出一个小工具、落地页、小游戏。
- **核心场景**
  1. "帮我做一个番茄钟，带今日完成统计" → 2 分钟内看到可用应用。
  2. "把主题改成暗色，按钮再大一点" → 在原有基础上增量修改。
  3. "这个版本改坏了" → 回滚到上一个版本。
  4. "发给朋友玩" → 一键发布，得到 `/p/xxxx` 公开链接。

---

## 3. 功能清单（按优先级）

### P0 — 必须完成（核心主流程，约 5h）

| # | 功能 | 说明 | 验收标准 |
|---|---|---|---|
| F1 | 账号体系 | InsForge Auth 邮箱+密码注册/登录（通过 `insforge.toml` 关闭邮箱验证，注册即登录）；可选 GitHub/Google OAuth；登录页提供**公共体验账号**一键登录（InsForge 无匿名登录，用此替代"游客模式"） | 新用户 30 秒内进入工作台；刷新后会话保持 |
| F2 | 首页 / 新建项目 | 大输入框 + 示例 Prompt 卡片（番茄钟、记账本、贪吃蛇、个人主页） | 回车即创建项目并跳转工作台开始生成 |
| F3 | 项目列表 | Dashboard 展示我的项目（缩略标题、更新时间、是否已发布），支持重命名/删除 | 数据来自 DB，跨设备一致 |
| F4 | 多 Agent 生成流水线 | Mike(Team Leader) 写 brief 并指派 → Emma(PM) 需求要点 → Bob(架构师) 文件规划 → Alex(工程师) 流式写代码；每条回复带 Activity card（可展开步骤）和完成后的 Version card | 左侧聊天区按角色分段流式显示；每步有状态（思考中/完成）；可随时停止 |
| F5 | 代码查看 | 右侧 Code 标签：文件树 + 只读代码高亮，生成时可看到文件逐个出现 | 文件内容与预览一致 |
| F6 | 实时预览（App Viewer） | 右侧 Preview 标签：沙箱 iframe 渲染生成应用；工具栏含设备切换、刷新、新标签打开、**Console 面板**（iframe 日志和报错） | 生成完成自动刷新预览；Console 能看到应用里的 `console.log` |
| F7 | 对话式迭代 | 在已有代码基础上继续提需求，Agent 只改动相关文件 | 第二轮修改后旧功能仍在 |
| F8 | 数据持久化 | 项目、消息、版本快照全部入库；刷新/重新登录后完整恢复 | 关闭浏览器再打开，聊天记录和预览都在 |
| F9 | 一键发布（Publish） | 发布面板：可编辑 slug（6–30 位小写字母/数字/连字符），生成公开链接 `/p/{slug}`；成功提示"Your app is live!"；支持更新到最新版本和下线 | 隐身窗口能打开并正常使用生成的应用 |

### P1 — 延展能力（亮点，约 2h，至少完成 2 个）

| # | 功能 | 说明 |
|---|---|---|
| E1 | **版本历史与回滚** | Versions 标签：每个版本可预览、Restore（=新建一个版本，不破坏历史）；Agent 消息上的 Revert 按钮直达对应版本 |
| E2 | **Issue Report + Resolve（报错自动修复）** | iframe 内注入错误捕获脚本，通过 `postMessage` 把运行时错误回传；左下角弹 Issue Report，一键 **Resolve** 让 Alex 带着报错修复 |
| E3 | Discover 广场 + Remix | 已发布应用出现在公开广场，任何登录用户可 Remix 到自己账号继续改 |
| E4 | 代码可编辑 | Code 标签支持手动编辑并保存为新版本（CodeMirror 6） |
| E5 | 消息排队 | Agent 忙时用户的新消息进入队列，可删除，按顺序执行 |
| E6 | 主题预设 | 首页/输入框选择 4–6 个主题预设（配色+字体），作为约束拼进 prompt |

### 部署后增强 — N1–N5 / V1（新增范围，尚待实施验收）

来源：[实现审计](IMPLEMENTATION-AUDIT-2026-10-10.md)、[Atoms 官方功能对比与实测](ATOMS-OFFICIAL-FEATURES-2026-10-10.md)。对标对象是 **atoms.dev**。官方文档声明、当前账号实际可用能力和本 Demo 的实现状态分别记录，不把付费入口当作已验证能力。

**顺序约束：**先完成当前部署及 M7 验收，再按 PLAN §6 开展增强。审计发现的版本一致性、保存、重试和失败恢复问题是增强的前置条件；复核时已修复的项目以新证据关闭。这批工作不计入原始 6–8 小时预算，也不把现有 E1/E2/E3/E6 重列为新功能。

| ID | 新增能力 | 用户价值与范围 | 优先级 |
|---|---|---|---|
| N1 | 生成结果检查 | 保存后检查文件完整性及相对资源引用；打开该版本预览后展示实际收到的启动和运行错误信息，发布前再次核对版本 | 高 |
| N2 | 文件加入聊天 | Code 中将文件加入下一条消息；显示文件名、所属版本、移除入口，帮助 Alex 定位修改 | 高 |
| N3 | 版本改动摘要 / Diff | 先显示新增、修改、删除文件，再按需展开文本差异；明确当前、查看中、已发布三个版本状态 | 高 |
| N4 | 源码 ZIP 导出 | 项目所有者导出当前或选中的历史版本，得到原始生成文件和本地运行说明 | 高 |
| N5 | 点选预览元素 | 点击元素后把标签、简短文字与定位提示加入聊天，再通过正常生成链路创建新版本 | 中 |
| V1 | 原创 Agent 素材 | 四位 Agent 使用统一画风的小头像，保留姓名/角色与字母回退；少量功能性状态素材视效果选用 | 中 |

#### N1：展示可验证的检查结果

- 检查绑定不可变 `versionId`、内容摘要、时间；预览结果还绑定本次预览会话。草稿不得覆盖已保存版本的检查结果。
- 服务端检查入口、允许的文件路径、文件大小和本地资源引用；外链资源标为依赖，不能因本地检查通过就声称可联网访问。
- 预览等待启动信号最多 10 秒，启动后观察 3 秒并继续接收后续错误。界面表述为“静态检查通过”“已收到启动信号”“观察期间未收到错误”，不写“全部测试通过”。启动超时显示未完成，Resolve 仅使用真实捕获的问题。
- 发布前服务端重新检查待发布快照，静态错误阻止发布。当前会话已捕获运行错误时，引导 Resolve；尚无预览证据时提示先预览。前端上报可能被生成代码伪造，仅是诊断信息，不能代替授权或安全判断。
- 不加入虚构 Terminal、Browser 或 Visual Review 步骤，不引入执行任意依赖的容器环境。

#### N2：文件引用与重试

- 每条消息最多引用 6 个现有文件，记录 `{path, versionId}`；服务端从该用户有权限的项目快照读取内容，不接受任意磁盘路径。
- 发送时引用必须属于当前版本；如果版本已变化，返回明确冲突并要求用户重新选择，不静默换成另一版文件。
- 消息历史保留引用信息。重试保留同一原始输入和引用，以请求标识避免重复保存；不会改用数据库中上一条用户消息。

#### N3 / N4：看懂改动、拿走成果

- Diff 默认比较所选版本与其前一版本；首版标为全部新增。展示真实文件差异，不用模型生成的总结替代差异证据；支持换行差异、空文件、文件增删和超长内容折叠，沿用现有文件数量/大小限制。
- 查看 Diff 不改当前版本，也不改发布版本；Restore 仍走已有的新建版本流程。
- ZIP 在服务端校验项目所有权及版本归属，仅包含生成快照与运行说明，不带平台消息、密钥、日志或预览注入脚本。拒绝绝对路径、`..` 和 ZIP 路径穿越。
- 导出说明标出外部 CDN/联网依赖及平台存储桥的差异，建议用本地 HTTP 服务运行；说明文件遇到同名文件时另取名，不能覆盖用户源码。支持删除/过期版本错误反馈，不承诺离线运行所有生成应用。

#### N5：有限的元素选择

- 在现有 sandbox 中注入选择桥，保持 `allow-scripts allow-forms allow-modals`，绝不加入 `allow-same-origin`。
- 只在选择模式拦截点击；退出/Esc 后恢复应用交互。父页验证 `event.source`、会话标识、版本和消息结构，并限制长度与频率；opaque origin 不能靠 origin 字符串鉴权。
- 上下文只取标签、有限长度可见文本、定位提示；不读取表单值、密码、存储或页面完整 HTML。动态 DOM 的定位只是线索，不承诺精确反推源码行。
- 用户可移除选中上下文；发送后由 Alex 走现有迭代/版本链路。初期只支持当前版本，不包含拖拽布局或直接改 CSS 属性面板。

#### V1：可上线的原创视觉素材

- 遵循 [DESIGN.md](../DESIGN.md) 的 Quiet studio：Mike 暖棕、Emma 梅紫、Bob 灰蓝、Alex 森林绿；使用原创人物/小角色，不复制 Atoms 的头像、标志或吉祥物。
- 以 Codex 内置图像生成为头像候选；Logo、图标、按钮和对话布局继续使用可编辑 SVG/CSS。生成的 UI 图片只作参考，不作为可交互页面交付。
- 首批必选仅四枚头像；额外状态小物件、空态图或分享图按实际效果取舍。不得制造不存在的完成状态或增加持续装饰动画。
- 头像显示 24/32px，预留固定尺寸，深浅色与小尺寸均验收；保留字母回退及姓名/角色文本。上线图优先透明 WebP/PNG，单枚目标 ≤30KB、四枚合计 ≤120KB。
- 提示词、来源、选稿、尺寸和文件对应关系可追溯；成品纳入仓库 `public/` 并随站点部署。原始大图单独保存，不进入首屏加载。详见 [视觉素材方案](VISUAL-ASSET-PLAN.md)。

### P2 — 有时间再做 / 写进 README 的"后续规划"

- 完整可视化编辑器（拖拽布局、直接改样式）；轻量点选上下文已提升为 N5
- 生成应用接入数据存储（给生成应用提供一个 KV API，让 TODO 类应用能真持久化）
- 更多角色：David（数据分析）、Iris（深度调研，联网搜索）
- 团队模式 / 引擎切换（类似 Atoms 的 Race Mode：同一需求两个模型并行生成，择优）
- 推送 GitHub；源码 ZIP 已提升为 N4
- 用量计费与额度

---

## 4. 产品设计

### 4.1 信息架构 / 路由

```
/                     落地页 + Prompt 输入（未登录点击生成 → 引导登录或使用体验账号）
/login                登录 / 注册 / 体验账号一键登录
/dashboard            我的项目列表
/project/[id]         工作台（核心页面）
/p/[slug]             已发布应用（公开，全屏渲染生成的应用 + 底部 "Made with Atoms Lite · Remix" 小角标）
```

### 4.2 核心页面：工作台布局

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ◀ 项目名(可编辑)        v3 ▾ 版本          [Share] [Publish ●]   头像     │
├──────────────────────────────┬────────────────────────────────────────────┤
│ 💬 对话区 (≈38%)              │ [Preview] [Code] [Versions]   🖥 📱 ⟳ ↗    │
│                              │                                            │
│ 👤 你：做一个番茄钟…          │  ┌──────────────────────────────────────┐  │
│                              │  │                                      │  │
│ 🟠 Mike · Team Leader ✓ brief │  │        生成应用的 iframe 预览          │  │
│   - 核心功能：25/5 分钟…      │  │                                      │  │
│ 🔵 Bob · 架构师      ✓        │  │                                      │  │
│   index.html / app.js / …    │  │                                      │  │
│ 🟢 Alex · 工程师  ✍ 写入中…    │  └──────────────────────────────────────┘  │
│   ▸ index.html  ✓            │                                            │
│   ▸ app.js      ⏳            │ ⚠ Issue Report: 1 个运行时错误 [Resolve] [Console]│
│                              │                                            │
│ ┌──────────────────────────┐ │                                            │
│ │ 继续描述你的修改…    [➤] │ │                                            │
│ └──────────────────────────┘ │                                            │
└──────────────────────────────┴────────────────────────────────────────────┘
```

**交互要点**
- 每个 Agent 消息是一张"角色卡"：头像、名称、角色、状态（思考中/完成/失败）、可折叠内容。工程师卡片内展示"正在写入的文件"进度，而不是把整段代码糊在聊天里（代码放到 Code 标签）。
- 生成过程中输入框禁用并显示"停止"按钮（AbortController 中断）。
- 首次生成完成后自动切到 Preview；生成中若用户在 Code 标签，则实时看到文件内容增长。
- 移动端：对话 / 预览改为上下 Tab 切换（不追求完美，保证可用）。

### 4.3 视觉风格

- 以 [DESIGN.md](../DESIGN.md) 为视觉真源：Quiet studio、中性灰白、轻量分隔、单一主操作；角色色主要用于头像。
- 组件库 shadcn/ui + Tailwind；Geist 正文、Geist Mono 代码、Instrument Serif 局部标题，支持深浅色。原创头像按 V1 验收后接入，字母头像保留为回退。
- 关键状态都要有设计：空项目列表、生成中骨架、生成失败（可重试）、预览报错条、发布成功弹窗（复制链接）。

### 4.4 Agent 角色设定

| 角色 | 名字 | 职责 | 输出 | 模型调用 |
|---|---|---|---|---|
| Team Leader | Mike | 读需求 → 写 brief → 决定这次需要谁（新项目：Emma→Bob→Alex；小改动：直接 Alex） | brief + 指派（结构化 JSON） | 小调用，快模型 |
| 产品经理 | Emma | 把用户一句话扩展为 3–6 条功能点 + UI 风格 | 简短 Markdown | 小调用，流式 |
| 架构师 | Bob | 决定文件结构与技术方案（纯 HTML/CSS/JS，可用 CDN 的 Tailwind / React / Chart.js 等） | 文件清单 JSON + 一句话说明 | 小调用，结构化 |
| 工程师 | Alex | 按规划写代码；迭代时只输出变更文件 | `<file path="…">…</file>` 流式块 | 主调用，流式 |
| （P1）QA | — | 接收 iframe 报错，交给 Alex 修复 | 修复后的文件 | 复用 Alex |

> **迭代轮的简化**：与 Atoms 一致，由 Mike 决定这次要谁参与。小改动（"按钮改大"）由 Mike 直接指派 Alex，跳过 Emma/Bob；大改动（新增页面/重构）才重新走 Emma/Bob。这样既保留多 Agent 体验，又控制延迟和成本。

---

## 5. 技术方案

### 5.1 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | **Next.js 15 (App Router) + TypeScript** | 前后端一体，API Route 处理流式；InsForge Sites 直接部署 |
| UI | **Tailwind CSS + shadcn/ui + lucide-react** | 快速出高质量 UI，风格接近 Atoms |
| 状态管理 | React state + **Zustand**（工作台状态） | 轻量，够用 |
| 代码展示/编辑 | **Shiki**（只读高亮）→ P1 换 **CodeMirror 6** | Monaco 太重，CodeMirror 足够 |
| 预览 | **沙箱 iframe + `srcdoc`**（`sandbox="allow-scripts allow-forms allow-modals"`，不给 `allow-same-origin`） | 零依赖、秒开、隔离安全；发布页可复用同一渲染逻辑 |
| 后端 / DB / Auth | **InsForge**：Postgres + Auth + RLS（`auth.uid()`、`auth.users`），前端用 `@insforge/sdk`，Next.js 用 `@insforge/sdk/ssr`（httpOnly refresh token） | 一个平台覆盖 DB/Auth/AI 网关/托管；CLI 对 Agent 友好（迁移、日志、诊断都可脚本化） |
| LLM | **InsForge Model Gateway → OpenRouter**，用 OpenAI SDK（`openai`）调用；Alex 用 `anthropic/claude-sonnet-5.5`（$2/$10 每百万 token），Mike/Emma/Bob 用 `anthropic/claude-haiku-5.5`（$0.1/$0.5）；模型 ID 已在 OpenRouter models 接口核实（2026-10），通过 `OPENROUTER_CHAT_MODEL` 等环境变量可替换 | InsForge 托管 provider key、按项目统计用量和限额；换模型只改字符串 |
| 流式 | OpenAI SDK `stream: true` → 服务端解析 → SSE 推给浏览器 | 不再引入 Vercel AI SDK，少一层依赖 |
| 部署 | **InsForge Sites**（`npx @insforge/cli deployments deploy .`，底层是 Vercel，支持 Next.js SSR/API Route），默认域名 `https://<slug>.insforge.site` | 前后端都在 InsForge 一处管理；环境变量用 `deployments env set` 持久化 |
| 迁移 / 配置 | `insforge db migrations` 管 SQL；`insforge.toml`（`config plan/apply`）管认证配置 | 配置即代码，可提交到仓库，评审可复现 |
| 校验 | **Zod** | API 入参与 Agent 结构化输出校验 |

**为什么不用 Sandpack / WebContainer？** Sandpack 依赖外部 bundler、WebContainer 需要跨域隔离头且启动慢；在 8 小时范围内，"多文件静态应用 + iframe srcdoc" 是稳定性和体验最好的折中。生成应用仍可通过 CDN 使用 React/Vue/Tailwind，表达力足够。写进 README 作为关键取舍。

**为什么生成接口放在 Next.js Route Handler，而不是 InsForge Edge Function / Compute？**
- 已核实的 InsForge 能力：Edge Functions 跑在 Deno 上，支持流式响应，定位是"请求/响应和短任务"；Compute 是 Fly.io 上的常驻容器，适合长任务。
- Route Handler 和前端同仓、同部署，开发最快。H0 阶段先做一次 **90 秒流式压测**，确认 Sites（Vercel）上的函数时长够用；不够就把 `/api/generate` 平移到 Edge Function，再不行用 Compute（Dockerfile + `compute deploy`，需要装 `flyctl`）。代码按"编排器纯函数 + 薄路由"组织，方便平移。

**InsForge 关键事实（已对照官网/文档核实，2026-10）**

| 项 | 内容 | 对本项目的影响 |
|---|---|---|
| Free 计划 | $0；**AI 额度只有 $1**；DB 500MB；5 万 MAU；Sites 构建 600 分钟/月；**7 天无请求自动暂停** | $1 的 AI 额度大概只够十几次完整生成 → 需要升级 Pro 或换自己的 OpenRouter key；评审期间要防止项目被暂停 |
| Pro 计划 | $25/月，含 $10 AI 额度，不会自动暂停 | 最省心的方案 |
| Auth | 邮箱密码、magic link/OTP、Google/GitHub 等 OAuth；**没有匿名登录** | 游客模式改为体验账号 + 关闭邮箱验证 |
| Model Gateway | OpenAI 兼容接口，经 OpenRouter 路由，可用 Anthropic/OpenAI/Google 等模型；按项目限额，超限返回 429 | 不需要自己管 Anthropic key |
| Sites | 上传源码由 Vercel 构建；支持 Next.js；服务端代码默认在 `iad1`，可在 `vercel.json` 改 region | 需要先本地 `npm run build` 通过再部署 |
| MCP | 远程 MCP `https://mcp.insforge.dev/mcp`（OAuth） | 可选，CLI + Skill 已够用 |

### 5.2 系统架构

```
Browser
 ├─ Workspace UI (Next.js client)
 │    ├─ ChatPanel ── POST /api/generate  ──(SSE: agent 事件流)──┐
 │    ├─ CodePanel  ← files state (Zustand)                     │
 │    └─ PreviewPanel ← iframe srcdoc ← buildHtml(files)        │
 │           └─ window.onerror → postMessage → 错误条 (E2)       │
 │                                                              ▼
Next.js Route Handlers（部署在 InsForge Sites，底层 Vercel）
 ├─ /api/generate   编排器 Orchestrator：Emma → Bob → Alex
 │     ├─ 经 InsForge Model Gateway / OpenRouter 调用 LLM（流式）
 │     ├─ 增量解析 <file> 块 → 推送 file_delta 事件
 │     └─ 完成后写入 messages / versions
 ├─ /api/projects/*  CRUD
 ├─ /api/publish     生成 slug，标记发布版本
 └─ /p/[slug]        服务端读取已发布版本 → 输出完整 HTML
                                                              │
InsForge: Auth · Postgres(RLS) · Model Gateway ◄──────────────┘
```

### 5.3 生成协议（关键设计）

**模型输出格式**：不用 JSON（流式下难解析、转义易错），用 XML 风格标签：

```
<file path="index.html">
...完整文件内容...
</file>
<file path="app.js">
...
</file>
<summary>一句话说明本次改动</summary>
```

- 服务端用一个**增量状态机解析器**：识别 `<file path>` 开始 → 推送 `file_start`，内容推送 `file_delta`，`</file>` 推送 `file_end`。
- 迭代轮：把当前所有文件作为上下文发送，要求只输出**变更后的完整文件**（不做 diff patch，降低出错率；小应用文件体积小，可接受）。
- 约束写进 system prompt：入口必须是 `index.html`；只能引用相对路径文件或白名单 CDN；不得使用 `localStorage` 以外的持久化；总文件 ≤ 6 个。

**SSE 事件定义**（`text/event-stream`，每条 `data: JSON`）：

```ts
type AgentEvent =
  | { type: 'agent_start'; agent: 'mike' | 'emma' | 'bob' | 'alex'; messageId: string }
  | { type: 'text_delta'; agent: AgentId; delta: string }        // 角色说的话
  | { type: 'file_start'; path: string }
  | { type: 'file_delta'; path: string; delta: string }
  | { type: 'file_end'; path: string }
  | { type: 'agent_end'; agent: AgentId }
  | { type: 'version_created'; versionId: string; number: number; files: Record<string, string>; summary: string }
  | { type: 'error'; message: string; retryable: boolean }
  | { type: 'done' };
```

**预览拼装**（`buildPreviewHtml(files)`）：
- 读取 `index.html`，把 `<link href="style.css">` / `<script src="app.js">` 替换为内联内容（相对路径映射到 files）。
- 在 `<head>` 最前注入错误捕获脚本（`window.onerror` / `unhandledrejection` / `console.error` → `parent.postMessage`）。
- 发布页 `/p/[slug]` 复用同一函数，服务端输出（不注入调试脚本）。

### 5.4 数据模型（InsForge Postgres）

```sql
-- 用户资料（auth.users 由 InsForge 管理，只引用、不修改）
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  title text not null default 'Untitled',
  current_version_id uuid,                 -- 指向 versions.id
  published_slug text unique,              -- 非空即已发布
  published_version_id uuid,
  remixed_from uuid references projects(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  role text not null check (role in ('user','mike','emma','bob','alex','system')),
  content text not null,                   -- Markdown
  meta jsonb default '{}',                 -- 如 {files:["index.html"], status:"done"}
  version_id uuid,                         -- 本条消息产生的版本
  created_at timestamptz default now()
);

create table versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  number int not null,                     -- 项目内自增 v1, v2...
  files jsonb not null,                    -- {"index.html": "...", "app.js": "..."} 全量快照
  summary text,
  created_at timestamptz default now(),
  unique (project_id, number)
);

create table usage_logs (                  -- 限流 & 成本观测
  id bigserial primary key,
  user_id uuid not null,
  project_id uuid,
  model text, input_tokens int, output_tokens int,
  created_at timestamptz default now()
);
```

- **RLS**：`projects/messages/versions` 仅 `owner_id = (select auth.uid())` 可读写（子表通过父项目 owner 判断）；已发布版本由服务端用 `createAdminClient({ apiKey })` 按 slug 读取，不对匿名开放整表。
- **写入注意**：InsForge SDK 的 insert 必须传数组 `insert([{...}])`；所有方法返回 `{ data, error }`。
- **请求账本（M8）**：`generation_requests` 保存请求 ID、项目/用户、输入摘要、预期版本、运行租约与最终收据；浏览器不可读写。`claim_generation` / `finish_generation` / `restore_snapshot` 仅服务端调用，项目锁与事务保护版本、消息、指针及用量。检查返回结果是版本绑定记录，浏览器观察仅在当前会话保存，不伪装成持久化测试报告。
- **快照而非 diff**：小应用单版本 < 100KB，全量 jsonb 实现最简单，回滚 = 复制快照。

### 5.5 API 设计

| Method | Path | 说明 |
|---|---|---|
| POST | `/api/projects` | 创建项目（可带初始 prompt） |
| GET | `/api/projects` | 我的项目列表 |
| GET | `/api/projects/:id` | 项目详情 + 消息 + 当前版本文件 |
| PATCH / DELETE | `/api/projects/:id` | 重命名 / 删除 |
| POST | `/api/generate` | `{projectId, requestId, expectedVersionId, prompt?, mode?, errors?}` → SSE；同输入请求可重放，旧版本冲突 409 |
| GET | `/api/projects/:id/versions` | 版本列表（工作台目前直接通过 RLS 查询） |
| GET | `/api/projects/:id/versions/:versionId` | 所有者读取快照、SHA-256 与静态检查记录，private/no-store |
| POST | `/api/projects/:id/restore` | `{versionId, expectedVersionId}` 原子恢复为新版本 |
| POST | `/api/projects/:id/publish` | `{versionId, slug?}` 检查并发布指定当前快照，冲突 409、静态错误 422 |
| POST | `/api/projects/:id/remix` | （P1）复制已发布项目 |
| GET | `/p/:slug` | 公开渲染（Next.js route，返回 HTML） |

> 读写简单的 CRUD 也可直接在客户端用 `@insforge/sdk` + RLS 完成，减少 API 数量；`generate` / `publish` 必须走服务端（需要 `OPENROUTER_API_KEY` / InsForge admin API key）。

### 5.6 非功能需求

| 项 | 方案 |
|---|---|
| 安全 | 生成代码只在无 `allow-same-origin` 的 sandbox iframe 中执行，无法读主站 cookie；发布页挂在同域但仅输出静态 HTML，加 CSP；`OPENROUTER_API_KEY` 与 InsForge admin key 只在服务端，绝不使用 `NEXT_PUBLIC_` 前缀 |
| 成本/滥用 | 每用户每日生成次数上限（如 30 次，体验账号 10 次），基于 `usage_logs` 计数；`max_completion_tokens` 上限；Model Gateway 项目级限额兜底（超限返回 429，前端提示） |
| 性能 | 首字节 < 2s（Emma 用快模型）；完整生成 30–90s，全程有流式反馈 |
| 稳定性 | Route Handler 设 `maxDuration`，H0 压测确认；LLM 调用失败可重试；解析失败时保留上一个可用版本，不写坏数据；防止 Free 项目 7 天无请求被暂停（升级 Pro 或加 schedule 定时请求保活） |
| 可观测 | `npx @insforge/cli logs` / `diagnose` 查后端；`deployments status` 查构建；usage_logs 记录 token |
| 兼容性 | Chrome / Safari / Edge 最新版；移动端可浏览 |

---

## 6. 工程计划（8 小时）

### 6.0 成本估算（决定 AI 额度方案）

| 调用 | 模型 | 典型 token（入/出） | 单次成本 |
|---|---|---|---|
| Mike + Emma + Bob | claude-haiku-5.5 | 3k / 1.5k（合计） | ≈ $0.001 |
| Alex 首次生成 | claude-sonnet-5.5 | 5k / 8k | ≈ $0.09 |
| Alex 迭代（带上全部现有文件） | claude-sonnet-5.5 | 15k / 8k | ≈ $0.11 |

→ 一次完整生成约 **$0.1**。Free 计划的 $1 AI 额度大约够 **10 次**；Pro 的 $10 约 100 次。

**决定：先用 InsForge 现有额度，不够再说。** 为此开发期间严格省额度：

| 策略 | 做法 | 省多少 |
|---|---|---|
| **Mock 模式** | `LLM_MOCK=1` 时编排器不调模型，按真实格式回放录好的事件流（`fixtures/*.jsonl`，每个示例 Prompt 一份）。UI、解析器、写库、预览、版本、发布全部用 mock 开发和测试 | 开发期 90%+ 的调用 |
| 录制一次、反复用 | 第一次真实生成时把 SSE 事件流存成 fixture，之后回放 | — |
| 开发期全用 Haiku | `OPENROUTER_CHAT_MODEL` 开发时设为 `claude-haiku-5.5`（约 1/20 成本），只在最终验收前切回 Sonnet | 单次 $0.1 → 约 $0.005 |
| 输出上限 | `max_completion_tokens` 限制在 8k；文件数 ≤ 6 | 防失控 |
| 线上限额 | 每用户每日生成次数限制；网关 429 时友好提示 | 防评审期被刷 |

额度预算：开发期真实调用控制在约 $0.3（录 fixture + 联调），保留约 $0.7（Sonnet 约 7 次）给最终验收和评审试用。如果评审期额度耗尽，评审只会看到"额度已用完"的提示，因此提交前要评估是否升级 Pro。

### 6.1 里程碑与验收标准

> 逐项任务拆解、决策关口和可执行的验收清单见 [PLAN.md](PLAN.md)（M0–M7，与下表一一对应，时间分配略有调整）。

| 时段 | 里程碑 | 内容 | 完成标准（DoD） | Commit |
|---|---|---|---|---|
| H0 (0.75h) | 脚手架 + 上线 | `insforge create`/`link` → `create-next-app` + Tailwind 3.4 + shadcn → `db migrations` 建表 + RLS → `config apply` 关邮箱验证 → `ai setup` → `deployments env set` → `deployments deploy .`；**90 秒流式压测接口** | 线上 `*.insforge.site` 可访问；压测结论写入 README；CI 绿 | `chore: scaffold` |
| H1 (1h) | 账号 + 项目 | 登录/注册/体验账号、`@insforge/sdk/ssr` 会话中间件、Dashboard、新建/重命名/删除项目 | 注册→登录→建项目→刷新仍在；RLS 下看不到别人的项目 | `feat: auth & projects` |
| H2 (1.5h) | 生成核心 | Mike/Emma/Bob/Alex prompt、编排器、`<file>` 流式解析器（含单测）、SSE、写 messages/versions | curl 调 `/api/generate` 能看到完整事件流，DB 里有版本 | `feat: agent pipeline` |
| H3.5 (1.5h) | 工作台 UI | 双栏布局、角色卡（Activity card + Version card）、Code 文件树、Preview（设备切换/刷新/新标签/Console）、停止按钮 | 浏览器里一句话生成番茄钟并可玩 | `feat: workspace` |
| H5 (0.5h) | 迭代 + 发布 | 多轮上下文（Mike 路由小改动直达 Alex）、Publish 面板、`/p/[slug]`、下线 | **P0 完成**；隐身窗口打开发布链接可用；部署线上 | `feat: publish` |
| H5.5 (1.5h) | 延展 | 按顺序做：E2 Issue Report + Resolve → E1 Versions/Restore/Revert → E3 Discover + Remix → E6 主题预设 | 每完成一个就部署一次 | `feat: …` 各一 |
| H7 (0.5h) | 打磨 | 用 `impeccable`（critique/polish）和 `frontend-design` 过一遍 UI；空/错/加载状态；移动端兜底；限流与 429 提示 | 主要页面无明显 UI 问题 | `style: polish` |
| H7.5 (0.5h) | 交付 | README（思路/取舍/完成度/规划）、截图或 GIF、2–3 个已发布示例、最终部署、线上走一遍 E2E 清单 | 7.5 提交验收全部打勾 | `docs: readme` |

**控时原则**：每个里程碑结束都 commit + 部署；P0 未完成前不碰 P1；任一功能超时 30 分钟即降级（例如 E2 降级为"仅展示错误 + 手动 Resolve"）；E4、E5 只在前面全部完成时才做。

### 6.2 目录结构

```
atoms-demo/
├─ app/
│  ├─ (marketing)/page.tsx          # 落地页
│  ├─ login/page.tsx
│  ├─ dashboard/page.tsx
│  ├─ project/[id]/page.tsx         # 工作台
│  ├─ p/[slug]/route.ts             # 公开发布页（返回 HTML）
│  └─ api/
│     ├─ generate/route.ts
│     └─ projects/[id]/{publish,restore,remix}/route.ts
├─ components/
│  ├─ workspace/{ChatPanel,AgentCard,CodePanel,PreviewPanel,VersionList,TopBar}.tsx
│  └─ ui/                           # shadcn
├─ lib/
│  ├─ agents/{prompts.ts,orchestrator.ts,router.ts}
│  ├─ parser/fileStreamParser.ts    # <file> 增量解析（附单测）
│  ├─ preview/buildPreviewHtml.ts   # 拼装 + 注入错误捕获
│  ├─ insforge/{client,server,admin}.ts   # sdk / sdk/ssr / createAdminClient
│  ├─ llm/openrouter.ts             # OpenAI SDK → OpenRouter
│  └─ store/workspace.ts            # Zustand
├─ migrations/                      # insforge db migrations
├─ insforge.toml                    # 认证等项目配置（config apply）
├─ .insforge/project.json           # link 生成（不提交）
├─ .github/workflows/ci.yml        # typecheck / lint / test / build
├─ .env.example
├─ AGENTS.md / CLAUDE.md           # Agent 协作约定
├─ docs/PRD.md
└─ README.md
```

### 6.3 测试策略（与时间匹配的最小集）

- **单测（Vitest）**：`fileStreamParser`（标签跨 chunk 切断、多文件、未闭合）、`buildPreviewHtml`（相对路径内联）。这两个是最容易出 bug、又最容易测的纯函数。
- **手工 E2E**：按第 7.3 节的验收用例，在**线上环境**逐条执行并记录结果。

### 6.4 风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| LLM 生成代码跑不起来 | 体验崩 | 严格 system prompt + 示例；E2 自动修复；保留上个可用版本 |
| 生成耗时长 / Sites 函数超时 | 生成中断 | H0 压测；流式 + `maxDuration`；限制文件数和 token；不够就迁到 Edge Function / Compute |
| InsForge Free 的 AI 额度只有 $1 | 开发中途或评审时生成失败 | Mock 模式开发 + 开发期用 Haiku（见 6.0）；提交前检查余额，必要时升级 Pro 或换 key；前端遇到 429 时友好提示 |
| Free 组织可同时运行的项目数有限 | 新项目建不了 | 个人组织里已有 1 个运行中、2 个暂停的项目；如果 create 被拒，暂停或删除不用的项目 |
| Free 项目 7 天无请求自动暂停 | 评审打不开 | 升级 Pro，或用 InsForge schedule 定时请求保活 |
| 部署构建失败 | 浪费时间 | 每次部署前本地 `npm run build`；用 `deployments status` 看日志 |
| 流式解析边界 bug | 文件内容错乱 | 状态机解析 + 单测覆盖跨 chunk |
| API 成本被刷 | 费用 | 每日限额 + 体验账号更低额度 |
| 时间不够 | 交付不完整 | P0/P1 严格分层；每个里程碑都上线 |

### 6.5 开发工作流

- **仓库**：GitHub 公开仓库 `atoms-demo`；`main` 为唯一长期分支，每个里程碑一个（或几个）commit，用 Conventional Commits（`feat:` / `fix:` / `chore:` / `docs:`），提交历史本身就能体现任务拆解。
- **CI**（GitHub Actions，H0 加上）：`npm ci` → `typecheck` → `lint` → `vitest` → `next build`。只做检查，不做自动部署。
- **部署**：`npm run deploy` 封装 `npx @insforge/cli deployments deploy .`；部署前必须本地 `npm run build` 通过。环境变量用 `deployments env set` 持久化，不进仓库。
- **密钥**：`.env*`、`.insforge/` 全部 gitignore；只提交 `.env.example`。`OPENROUTER_API_KEY` 和 InsForge admin key 只在服务端使用。
- **Agent 协作约定**：仓库根目录放 `AGENTS.md`（Claude Code / Codex 通用）和指向它的 `CLAUDE.md`，写清技术栈、目录约定、InsForge 注意事项（`insert([...])`、`{ data, error }`、Tailwind 3.4）和常用命令。
- **用到的 Skill**：`insforge` / `insforge-cli` / `insforge-debug`（后端与部署）、`frontend-design` / `impeccable`（UI）、`code-review`（交付前自查）。

---

## 7. 验收标准

一项功能"完成"= 满足下表验收标准 + 已部署到线上 + 在线上环境验证通过。

### 7.1 P0 功能验收（全部通过才算 P0 完成）

| # | 功能 | 验收标准 |
|---|---|---|
| F1 | 账号体系 | ① 新邮箱注册后无需验证邮件，直接进入 Dashboard；② 体验账号一键登录 ≤ 2 次点击；③ 刷新页面、关闭再打开浏览器后会话仍在；④ 退出登录后访问 `/dashboard`、`/project/*` 被重定向到登录页；⑤ 错误密码、重复注册有明确提示 |
| F2 | 首页 / 新建项目 | ① 输入需求回车即创建项目并跳转工作台，生成自动开始；② 点示例 Prompt 卡片可一键填入；③ 空输入不能提交 |
| F3 | 项目列表 | ① 显示标题、更新时间、是否已发布；② 重命名、删除生效且刷新后保持；③ 无项目时有空状态引导；④ 用户 A 看不到用户 B 的项目（RLS 生效，直接请求 API 也拿不到） |
| F4 | 多 Agent 生成 | ① 每条 Agent 消息显示身份标签（如 "Mike · Team Leader"）；② 首个角色在 3 秒内开始输出文字；③ Activity card 可展开，能看到"写入 index.html"等步骤；④ 完成后出现 Version card；⑤ "停止"按钮可中断，中断后页面可继续使用；⑥ 模型出错时显示可重试的错误，不留下损坏的版本 |
| F5 | 代码查看 | ① 文件树列出全部生成文件；② 生成中文件内容实时增长；③ 代码有语法高亮；④ 内容与预览实际运行的代码一致 |
| F6 | 实时预览 | ① 生成完成后预览自动刷新并可交互；② 桌面/手机宽度切换、刷新、新标签打开均可用；③ Console 面板能显示应用里的 `console.log` 和报错；④ 生成的代码无法读取主站 cookie / localStorage（sandbox 无 `allow-same-origin`） |
| F7 | 对话式迭代 | ① 在已有应用上提小改动（如"改成暗色主题"），由 Mike 直接指派 Alex，不再走 Emma/Bob；② 改动生效且原有功能仍在；③ 生成新版本号（v1 → v2） |
| F8 | 数据持久化 | ① 刷新、重新登录、换浏览器后，聊天记录、当前代码、版本列表完全恢复；② 生成中途刷新页面不会写坏数据（最多丢失本轮未完成的生成） |
| F9 | 一键发布 | ① slug 规则校验（6–30 位小写字母/数字/连字符，重复时提示）；② 发布后显示 "Your app is live!" 和可复制的链接；③ 隐身窗口（未登录）打开 `/p/{slug}` 可正常使用；④ 更新发布后链接内容变为最新版本；⑤ 下线后链接返回 404 页面 |

### 7.2 P1 延展能力验收（至少完成 2 项）

| # | 功能 | 验收标准 |
|---|---|---|
| E1 | 版本历史与回滚 | ① Versions 列出所有版本（编号、摘要、时间）；② 可预览任一历史版本而不改变当前版本；③ Restore 后生成新版本，历史不丢失；④ Agent 消息上的 Revert 可回到该消息之前的版本 |
| E2 | Issue Report + Resolve | ① 应用运行时抛错后 2 秒内弹出 Issue Report，显示错误信息；② 点击 Resolve 后 Alex 带着报错修复并生成新版本；③ 用一个故意制造的错误（如调用未定义函数）验证修复后错误消失 |
| E3 | Discover + Remix | ① 已发布应用出现在 Discover 广场；② 其他登录用户点 Remix 后得到一份属于自己的副本（含代码，不含原聊天记录），原项目不受影响 |
| E4 | 代码可编辑 | 手动修改代码并保存后生成新版本，预览同步更新 |
| E5 | 消息排队 | Agent 忙时发送的消息显示为"排队中"，可删除，当前任务完成后按顺序执行 |
| E6 | 主题预设 | 选择主题后生成的应用配色/字体明显符合所选主题 |

### 7.3 线上端到端验收用例（提交前在生产环境逐条执行）

| # | 步骤 | 预期结果 |
|---|---|---|
| T1 | 未登录打开首页 | 落地页正常显示，示例 Prompt 可见 |
| T2 | 用新邮箱注册 | 直接进入 Dashboard，空状态引导可见 |
| T3 | 输入"做一个番茄钟，带今日完成次数统计" | Mike → Emma → Bob → Alex 依次流式出现；≤ 120 秒生成完成；预览中计时器可开始/暂停 |
| T4 | 切到 Code 标签 | 看到 `index.html` 等文件，内容与预览一致 |
| T5 | 发送"改成暗色主题，按钮再大一点" | 只有 Mike 和 Alex 参与；预览变暗色，计时功能仍在；版本号 +1 |
| T6 | 在 Versions 中 Restore 到 v1（E1） | 预览回到亮色版本；版本列表新增一条，旧版本都在 |
| T7 | 发送"加一个按钮，点击时调用一个不存在的函数"（E2） | 点击按钮后弹出 Issue Report；点 Resolve 后修复，再点击不报错 |
| T8 | 发布，slug 填 `my-pomodoro` | 显示 "Your app is live!"；复制链接 |
| T9 | 隐身窗口打开发布链接 | 未登录也能正常使用番茄钟 |
| T10 | 退出登录，用体验账号登录 | 一键登录成功，能看到体验账号的示例项目 |
| T11 | 重新登录 T2 的账号，刷新、换浏览器 | 项目、聊天记录、版本完全恢复 |
| T12 | 用账号 B 直接访问账号 A 的 `/project/{id}` | 无权访问（提示或跳转），拿不到数据 |
| T13 | 手机宽度（375px）打开工作台和发布页 | 可用：对话/预览可切换，无横向滚动 |

### 7.4 非功能验收

| 项 | 标准 |
|---|---|
| 性能 | 首个 Agent 3 秒内开始输出；首次完整生成 ≤ 120 秒；Dashboard 首屏 ≤ 2 秒 |
| 稳定性 | T3 连续执行 3 次，至少成功 2 次；失败时有可重试的错误提示，不出现白屏 |
| 安全 | 仓库和前端产物中搜不到 `OPENROUTER_API_KEY`、InsForge admin key；RLS 隔离（T12）通过；生成的代码运行在无 `allow-same-origin` 的 sandbox 中 |
| 成本控制 | 超过每日生成次数或网关返回 429 时，前端给出明确提示而不是报错 |
| 工程质量 | CI（typecheck / lint / test / build）全绿；`fileStreamParser`、`buildPreviewHtml` 单测通过 |

### 7.5 提交验收（Definition of Done）

- [ ] P0 全部通过 7.1；P1 至少 2 项通过 7.2
- [ ] 7.3 用例在线上全部通过，结果记录在 README
- [ ] 7.4 非功能项全部满足
- [ ] 第 8 节交付物齐全，在线链接和 GitHub 均为 public 且可在未登录状态访问
- [ ] 题目文档副本的「4. 笔试结果回收」已填写链接，并已发给 HR（截止 2026-10-12）

---

### 7.6 部署后增强验收（新增，不代表当前已通过）

| 用例 | 验收步骤与通过标准 | 对应评分维度 |
|---|---|---|
| T14 可靠性回归 | 截断文件不进入成功快照；持久化故障不出现 UI 失败但版本已推进；前置失败重试仍使用原输入；SSE 提前结束可恢复；数据库/发布网络失败给出错误；修复 fixture 真正移除原错误 | 工程思维、完成度 |
| T15 检查可信度 | 完整/缺资源/语法错误/运行错误/启动超时各测一例；切换版本后旧检查失效；未执行检查不显示通过；发布只针对明确的快照 | 工程思维、体验 |
| T16 文件引用 | 加入/移除/发送/历史回看正常；版本过期有冲突提示；重试不丢引用；其他用户项目和越界路径被拒绝 | 完成度、体验 |
| T17 版本 Diff | 首版、文件增删改、空文件和长内容可读；切换比较对象不改变当前/发布指针；差异与快照逐项对应 | 体验、交付质量 |
| T18 ZIP 导出 | 当前/历史版解压内容与选定快照相符；本地 HTTP 服务可打开固定无外链样例；无平台注入/密钥；越权与路径穿越被拒绝 | 完成度、交付质量 |
| T19 元素选择 | 选中→带上下文发送→产生新版本；取消恢复按钮交互；旧会话/错误来源消息无效；不采集输入值；sandbox 约束保持；375px 可用 | 创新性、体验 |
| T20 视觉素材 | 四头像在 24/32px、深浅色、375px 清晰；失败回退稳定；读屏仍有角色名称；大小预算满足；线上素材 URL 200、无布局跳动；清单可追溯 | 体验、原创性 |
| T21 增量发布 | 新 SHA/部署 URL/环境模式有记录；T1–T13 回归无退化，T14–T20 有结果与证据；真实生成→迭代→发布至少走通一条；预算不足记录未验收，不能用 mock 冒充 | 交付质量 |

每项记录运行环境、版本、时间和结果；自动检查、mock 回放与真实模型/浏览器验收分别记录。素材质量不能抵消核心流程失败。

---

## 8. 交付物清单

- [x] 在线地址（InsForge Sites，`*.insforge.site`）
- [x] GitHub 公开仓库
- [x] README：项目介绍、截图/GIF、本地运行步骤、环境变量说明、架构图、关键取舍、完成度（✅/⏳）、后续规划及优先级
- [x] 一个测试账号或"体验账号"入口说明
- [x] 2–3 个已发布的示例应用链接（证明发布功能可用）
- [x] 简要说明文档（可放 README）：实现思路与关键取舍、完成程度、后续扩展与优先级

---

## 9. 待确认事项

1. **提交前是否升级 Pro**：开发期先用 Free 额度（已定）。提交前根据剩余额度决定：评审期如果额度不够或项目可能被暂停，再升级 Pro（$25/月）或换自带 OpenRouter key。
2. 是否需要 GitHub OAuth 登录（要在 GitHub 建 OAuth App 并在 InsForge 后台配置，约 15–20 分钟）。默认不做，体验账号 + 邮箱注册已够。
3. 产品名：仓库名用 `atoms-demo`；页面上的产品名默认 "Atoms Lite"，避免使用 Atoms 官方 logo 和配色。

**已确认**：后端与部署全部用 InsForge（账号已登录）；GitHub 仓库已建（`nomorekuiqian/atoms-demo`）。

## 10. 实施验收补记（2026-10-10）

F1–F9、E1/E2/E3/E6 及增强 N1–N5/V1 均已实现，M8–M14 的分阶段 Git/部署/证据见 PLAN §6.2 和 RELEASE-ENHANCED-2026-10-10.md。T1–T13 已重新走真实模型链路；T14–T20 的并发/错误注入、mock、浏览器与真实模型证据分别记录，T21 的真实生成→文件/元素迭代→检查→Diff→ZIP→发布通过。

“检查通过”仅指所记录的静态范围和当前预览会话观察，不证明全部应用行为。源码导出不包含平台注入、聊天、平台凭据或托管存储数据；用户自己要求写入源码的内容保持原样。Google 登录另有 GOOGLE-LOGIN.md，真实账号授权尚未验收；原生手机 IME 与社交平台分享预览不在本次浏览器模拟结果内。

## 11. 需求验收与退化检查增强（2026-10-10 新增）

实施顺序与状态见 PLAN §7（M15–M18）。本节是授权新增范围，不回填到原始 6–8 小时交付。

| ID | 能力 | 验收标准 |
|---|---|---|
| N6 | 需求验收清单 | 3–6 项可理解的需求/操作/预期；绑定版本；AI 建议、自动观察、人工确认、未验证分开；刷新及历史可读，所有者才能记录 |
| N7 | 有限自动验证 | 只执行平台允许的声明式浏览器动作；独立测试存储与会话、限时可取消；无效果按钮能被检测；不冒充全部业务测试通过 |
| N8 | 修改后的退化检查 | 继承原验收契约；已通过条目新版本失败明确提示；保留旧版与候选版；带失败证据修复，原功能再次验收 |
| N9 | 多 Agent 效果证据 | 10 个固定任务对照直接 Alex；独立验收断言；保留失败、成本、耗时与边界；结果不预设增强方案更好 |

T22–T25 分别对应可靠性、验收契约、行为/退化、实验及最终交付。未经执行的测试一律显示未验证；生成应用内回传可伪造，诊断证据不代替服务端授权或安全判断。暂不支持真实应用后端或依赖安装。


## 12. N10 — 独立 ReAct 子 Agent（2026-10-10 新授权范围）

后端改用 Vercel AI SDK ToolLoopAgent。Mike 以协调 Agent 的工具调用委派任务；Emma、Bob、Alex 各自有独立模型消息上下文、角色工具、观察结果后的迭代能力和停止条件。原 §5 中固定单次调用设计保留为历史，当前以本节和 PLAN M19 为准。

验收：四角色真实 SDK 循环；需求/架构提交前校验；Alex 能观察静态失败并在同一会话修复；已有契约不可削弱；未校验最新候选不得完成；越界写入、取消、预算耗尽不得覆盖旧版本；流式工具轨迹可见且刷新后可读。兼容原用户权限、额度、幂等和版本冲突协议。

范围边界：静态检查只验证入口、路径、大小和本地资源，不能证明 JavaScript 语义或浏览器交互。浏览器验收与人工确认继续绑定已保存版本；本轮不增加通用主机工具、容器、后台队列或可恢复检查点。
