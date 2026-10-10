# Atoms 官方文档、实机功能审计与 Demo 差距

研究日期：2026-10-10（Asia/Taipei）。代码快照：本轮读取时 HEAD 为 `71e56dc`；工作区在其他任务中继续变化。

## 结论与证据边界

Atoms 与我们当前 Demo 最主要的区别，是它围绕生成加入了精确提供上下文、人工编辑、检查改动、修复与恢复、云端后端和交付运营的完整工作流程。Demo 已具备核心生成、沙箱预览与发布，并已有 E1/E2/E3/E6 代码；下一步应先验证这些闭环，再补能提升可控性的小功能。

- 对标对象按仓库 PRD 确认为 **Atoms / atoms.dev**。用户口述的 adams.dev 未作为该产品地址使用。
- 官方资料部分研究帮助中心的 10 个关键页面；功能对比表中带 S 编号的描述为**官方文档宣称**，不代表全部功能均已实测或所有套餐可用。
- 实机部分使用用户已登录的 Chrome Atoms 页面，项目名为 Random Demo Page；检查既有生成记录、预览、主题、文件编辑器、分享和发布面板，并实际尝试文件引用和元素选择。没有重新登录、提交模型生成、改动项目源码、恢复版本、Remix、发布或升级套餐。临时输入引用已清除。
- Demo 部分为本轮源代码阅读所得，不是完整测试结果，也不代表线上已部署。
- 官方不同页面也可能存在版本差异。例如 Design 页面提到 Specify Version / Always Latest，而 Publish 当前 FAQ 明确说发布面板没有版本选择器。本文不把前者当作已确认现行功能。

## 功能对比

| 功能 | Atoms 官方文档所述 | 当前 Demo 代码 | 可移植方向 |
|---|---|---|---|
| 团队协作与工作证据 | Mike 分派，角色回复含活动和工具操作；完成回复带版本；聊天也可解释问题 [S1] | Mike 决定 full / alex_only；活动主要来自生成流程和文件事件 | 增加解释型请求；完成后说明改了哪些文件、哪些验证真正运行过 |
| 输入与模式 | Team Mode、@角色、#文件、附件；首页 Build / Goal，其中 Goal 由 Mike 规划分派；另有研究和 Race 入口 [S2] | `mode` 仅 build / fix，固定四角色，无文件引用/附件入口 | #文件引用最容易改善修改精度；单独讨论模式属于我们的产品提案，不能称为已核实 Atoms 模式 |
| 忙时排队与停止 | 新消息可排队、编辑、删除、排序；停止保留已完成工作 [S1] | Composer 忙时不允许提交；停止不落成功版本 | 先做一个可删待执行队列；草稿需与成功版本分离后再支持停止保留 |
| 预览 | 设备切换、刷新、新标签、Console，另有 Home、页面选择与 Design [S3] | 前四项已存在，纯 HTML/CSS/JS 沙箱 | 只有实现多页面路由后，页面选择才有意义；当前更应保证 Console 与修复流程 |
| 报错修复 | Issue Report 可查看日志、堆栈并手动 Resolve [S1] | 工作台现已传入 `onResolve`，生成接口支持 fix | 优先验收报错 → 修复 → 新版本 → 同动作不再报错；防止重复提交 |
| 历史与分支 | 查看旧版本、Restore；历史改动保留；可 Remix 选定旧版本，后端项目历史预览有限制 [S4] | 已有历史预览、restore API、消息 Revert；公开应用可 Remix | 补“复制当前/历史版本成新项目”，不必先公开；明确恢复目标及发布状态 |
| 编辑器 | 文件搜索、手动编辑会话、Submit all / Discard all、Diff、#引用和文件/项目下载 [S5] | CodeView 明确只读，无编辑会话和下载入口 | 下载 ZIP、引用当前文件、版本文件差异优先；完整编辑器放后 |
| 主题与点选编辑 | 主题共享变量；Visual Editor 选元素改样式/文字；Save / Discard；选中元素可交给聊天修改；图片素材库 [S6] | 首页 5 个主题仅拼入 prompt；无共享主题变量或点选编辑 | 先统一 CSS 变量约束，再做“点选元素 → 加入聊天”；完整属性面板和素材库成本高 |
| 分享 | Share 管项目 Public/Private、Discover 和 App Card；与成品发布独立 [S7] | Discover 直接查询已发布项目；暂无独立分享权限和 App Card | 可增加“在广场展示”开关；不要为仿照 UI 增加无效 Share 按钮 |
| 发布 | 固定公开 URL、手动 Update、下线、域名、发布前扫描；Cloud 另有数据相关设置 [S8] | slug / 更新 / 下线已有，公开页是沙箱外壳，无域名或扫描 | 显示当前版本与已发布版本、上次检测时间；简单规则检查应叫预发布检查，不伪称完整安全扫描 |
| 应用后端 | Cloud 支持生成应用数据库、用户、密钥、文件和 AI；项目/权限有适用限制 [S9] | InsForge 存的是 builder 自身项目、消息、版本；不等于生成应用拥有后端 | 属于架构扩展，需要隔离每个生成应用的身份、数据、密钥与权限 |
| 集成与支付 | Connector 可提供上下文、执行外部操作或支持生成应用；GitHub/Supabase/Stripe 等是示例，具体能力以账号目录为准 [S10] | 未发现生成应用的连接器管理或支付流程 | 不宜加空壳入口；GitHub 导出可后续做，支付要有服务端与回调验证 |

## 用户账号实机观察

2026-10-10 检查已有的 Random Demo Page，不创建新的收费生成任务。以下区分“界面/记录可见”和“操作结果已验证”。账号和项目状态只代表本次观察。

| 检查项 | 实际观察 | 证据强度与限制 |
|---|---|---|
| Agent 活动 | 现有一次生成由 Alex 展示 Processed 17 steps，包含读 README、写/更新 TSX/CSS、运行命令、Visual Review，再修改并重新验证 | 已打开既有记录；不是本轮新生成。这个例子没有依次展示四个角色，不能把固定四角色流水线当作 Atoms 每次必经流程 |
| 构建证据 | 点 Run command in Terminal 后，看到 Vite 构建产物、模块数量、build 成功与 prerender 输出 | 直接看到工具输出，比仅看到 Agent 声称“通过”更强；未独立重跑构建 |
| Visual Review | 活动中存在该工具卡；点击后切回 App Viewer | 只确认入口和历史声明，没有读到独立评分报告，因此不宣称其检查一定正确 |
| 实际工程类型 | 编辑器有 app/frontend、src/components、TSX、package.json、Vite/TypeScript 配置及 DESIGN.md | 当前例子是带构建工具的 React/TS 工程；与 Demo 的最多六个静态文件有架构差异 |
| 文件引用 | 点编辑器的 # 控件，输入框出现 README.md 引用及 from editor 附件卡 | 操作成功；未发送。已移除测试引用和附件 |
| 精确选择元素 | Select element 后点预览中的 Shape scale 标题，输入区出现 Design / h3，提示围绕所选元素提出修改 | 操作成功；未发送修改。退出后已取消元素选择 |
| 主题 | Theme 面板有搜索、Current Theme，当前为 Material You；可见多种命名风格如 Zen、Notion、Swiss Modernism 等 | 已打开面板；未应用新主题，不能据此证明切换质量。重点是成套设计约束，不是主题数量 |
| 编辑器限制 | 文件树和内容可读，页面提示编辑需付费套餐 | 当前账号受限；不能把官方“可编辑”视为免费账号可用 |
| 分享与发现 | Share Project 面板显示 Public/Private、Discover、App Card、Copy link、Export；当前 Private 显示 Pro+ 且不可用 | 已查看现有设置，未更改可见性或分享权限 |
| 导出限制 | 点击 Export 出现 Download Requires Upgrade，对话框说明下载限 PRO/MAX | 已验证当前账号限制，未升级；不构成所有账户/未来套餐的通用结论 |
| 发布 | 面板显示 atoms.world 网站地址、域名入口、移除徽标和最终 Publish；本账号部分选项禁用 | 只查看配置，未点击最终 Publish。实机域名与旧 PRD 中 pub.atoms.world 的描述不同，应避免写死旧格式 |
| 工具栏 | 可见 App Viewer、Editor、文件管理；更多菜单有 Terminal、Planner、Browser、Notebook | 入口可见，不代表每项都完成实测 |
| 历史 | 当前项目显示 v1 与 Remix，历史侧栏可见 | 只有一个版本，未验证多版本 Restore 或 Remix 结果 |

最重要的实机差距是“有可检查的执行过程”：Atoms 的这个项目呈现读文件 → 修改 → 运行构建 → 查看页面 → 再修改；Demo 主要是模型输出 → 解析/合并 → 保存 → 展示。要提升可信度，应补真实检查结果，不能只增加类似 Terminal/Visual Review 的装饰卡片。

## 当前代码状态修正

前轮聊天记录里的“尚未接通”属于当时审计快照。本轮读取发现以下代码已经存在，后续报告应改成“已实现，待验证/确认部署”而不是继续列为缺失：

- `components/workspace/workspace.tsx`：IssueReport、onResolve、onView、onRestore，以及消息 Revert 回调。
- `app/api/projects/[id]/restore/route.ts`：复制旧快照为新版本，并更新项目指针。
- `app/discover/page.tsx`、`app/remix/[slug]/`、`lib/remix/load.ts`：公开项目浏览与 Remix。
- `app/home-composer.tsx`、`lib/themes.ts`：5 个主题选择并拼入 prompt。

仍明确存在的差距：`components/workspace/code-view.tsx` 是只读；`composer.tsx` 在 busy 时禁止发送；`app/api/generate/route.ts` 只接受 build/fix；主题是自然语言约束，不是确定性的主题引擎。

阅读也发现可靠性仍应优先复核：restore API 的版本插入、指针更新、消息插入不是一个事务，消息失败未阻止成功响应；`lib/remix/load.ts` 数据库查询忽略 error。本文只指出源码风险，没有故障注入复现。

## 推荐增量：以 PRD 评分收益排序

以下为本项目的工程判断，不是 Atoms 官方推荐；成本为相对复杂度，未作时间承诺。

| 优先级 | 增量 | 为什么值得做 | 最小验收 | 成本 |
|---|---|---|---|---|
| 先做 | 完成修复/恢复/公开 Remix 的真实验收 | 直接证明完成度、创新性和可交付性；现有代码投资已在 | T6/T7、跨账号 Remix；恢复后再迭代；断网失败不损坏状态 | 中 |
| 高 | 生成后与发布前的轻量检查 | 吸收实机中“完成后验证”的价值，避免有代码就显示已验证 | 显示文件完整性、缺失引用、预览加载及观察到的运行时错误；标出检测版本/时间；有错误可 Resolve；未执行的测试不能标绿 | 中 |
| 高 | 当前文件“加入聊天” | 用户能准确说清要改哪个文件，也使多 Agent 交互更实用 | 引用存在的文件；发送后明确作为上下文；历史版本引用不误指当前 | 小 |
| 高 | 版本改动摘要 / Diff | 用户能判断 AI 到底做了什么，支持恢复决策 | 比较新增/修改/删除文件；只读，不更改当前/发布指针 | 小至中 |
| 高 | 下载源码 ZIP | 让成果可交付且不锁在平台里，适合演示题 | 导出当前确认版本；保留文件路径；包含运行说明；不夹带 builder 密钥 | 小 |
| 中 | 从自己的历史版本 Remix | 让用户探索另一种方案，复用已有快照结构 | 不公开原项目；新项目归当前用户；不复制私密历史消息 | 小至中 |
| 中 | 一个待执行消息 | 长任务时不丢新想法，比完整排序队列简单 | 当前成功后只运行一次；失败暂停队列；可取消；刷新行为有定义 | 中 |
| 中 | 点选元素加入聊天 | 比增加更多角色更直观地体现创新性 | 选中元素可见；发送 DOM 标识/文字/允许的样式上下文；退出恢复正常点击；保存为新版本 | 中 |
| 后做 | 手动代码编辑 | 增加精细控制，但需解决 AI 编辑冲突 | 草稿可预览；保存新版本；Discard 恢复；生成时禁改 | 中至大 |

不要在这些功能前再铺更多静态按钮。评分依据是用户能完成任务和异常能恢复，不是界面入口数量。

### 最小实现建议

1. **检查与修复闭环**：沿用现有解析器和预览错误桥；记录解析成功、必需资源存在、预览 ready/超时、运行时错误。将“代码已生成”与“检查结果”分开。没有浏览器交互测试时，只能说“预览已加载/暂未观察到错误”，不能说“功能测试通过”。不要在主站服务端直接执行生成 JS。
2. **文件加入聊天**：Code 面板加“加入聊天”动作，传文件路径与所属版本；发送前展示可删除引用卡。当前已发送全量文件，所以这个功能首先改善明确意图，而不自动等于减少 token。服务端只允许引用当前用户项目已有文件。
3. **版本差异**：用现有不可变快照比较新增/修改文件，默认与上一版本比较；第一版可只做文件级摘要，再加文本 Diff。标清当前、正在查看、已发布三个状态。
4. **源码交付**：下载当前确认版本的 ZIP，包含原始文件和简短运行说明；若项目依赖我们的 storage shim，离开 builder 后原生 localStorage 的行为需说明并实测。此处不需要先接 GitHub OAuth。
5. **点选元素修改**：在无 allow-same-origin 的 iframe 内注入选择脚本，通过现有 postMessage 传递有限的元素标识/文本；父页校验 event.source。先做“元素加入聊天”，不做任意 DOM 与源码的双向实时编辑。元素定位失效时要回退到普通修改请求。

如果只增加三项，建议在修复现有审计缺陷并验收 E1/E2 后，做“文件加入聊天 + 版本改动摘要 + 源码下载”；如果重点争取创新性演示，再加“点选元素加入聊天”。轻量检查属于可靠性收尾，应优先于新入口。

## 需要大架构的能力

1. **云端持续任务**：官方说关闭浏览器后任务可能继续，不是必然保证。若要在 Demo 做成明确承诺，需要持久任务状态、后台执行、事件重连、取消和幂等；不是单纯给 SSE 加重试。
2. **生成应用后端 / 登录 / 支付**：当前 builder 的 InsForge 账号体系不能直接当作每个生成应用的用户体系。需要应用隔离、服务端执行、密钥托管、权限和支付回调/重试设计，且超出 PRD 明确非目标。
3. **真实工具驱动的工程 Agent**：我们目前主要是模型输出文件。若要具备实际安装依赖、跑测试、检查浏览器的能力，需要执行环境和可验证工具结果；不能把生成进度包装成测试已通过。
4. **完整 Visual Editor**：从预览 DOM 映射回源码、CSS 继承、动态渲染和编辑冲突都是实际成本。可先做上下文选择，不承诺通用拖拽设计器。
5. **Race / 多模型并发**：增加生成成本、取消管理、候选版本与择优体验。对本题现有核心问题帮助较小。

## 官方来源

所有链接均为本轮实际打开的官方页面；页面内容可能继续变化。

- [S1 · Project Chat](https://help.atoms.dev/en/articles/12129550-project-chat)
- [S2 · Input Chat](https://help.atoms.dev/en/articles/12129552-input-chat)
- [S3 · App Viewer](https://help.atoms.dev/en/articles/12129554-app-viewer)
- [S4 · Project History](https://help.atoms.dev/en/articles/12129557-project-history)
- [S5 · Code and files](https://help.atoms.dev/en/articles/12129559-code-and-files)
- [S6 · Design and preview](https://help.atoms.dev/en/articles/12129553-design-and-preview)
- [S7 · Share a project](https://help.atoms.dev/en/articles/12129574-share-a-project)
- [S8 · Publish your project](https://help.atoms.dev/en/articles/12129577-publish-your-project)
- [S9 · Atoms Cloud](https://help.atoms.dev/en/articles/12129561-atoms-cloud)
- [S10 · Connect and Manage Integrations](https://help.atoms.dev/en/articles/12129568-integrations)

## 尚未验证与后续实测建议

本轮没有新生成或改动用户已有项目，因此无法评价 Atoms 在任意任务上的成功率、耗时、实际修复质量、版本恢复完整性或发布可用性。后续如需完整质量评测，再用一个明确的测试项目走：普通生成 → 指定文件/元素修改 → Diff → Restore → Remix → 发布。付费/套餐限制单独记录，不把文档能力直接算作账号可用能力。
