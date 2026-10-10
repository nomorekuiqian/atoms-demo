# Atoms 官方功能审计与 Demo 差距

研究日期：2026-10-10（Asia/Taipei）。代码快照：本轮读取时 HEAD 为 `71e56dc`；工作区在其他任务中继续变化。

## 结论与证据边界

Atoms 与我们当前 Demo 最主要的区别，是它围绕生成加入了精确提供上下文、人工编辑、检查改动、修复与恢复、云端后端和交付运营的完整工作流程。Demo 已具备核心生成、沙箱预览与发布，并已有 E1/E2/E3/E6 代码；下一步应先验证这些闭环，再补能提升可控性的小功能。

- 对标对象按仓库 PRD 确认为 **Atoms / atoms.dev**。用户口述的 adams.dev 未作为该产品地址使用。
- 本文研究官方公开帮助中心的 10 个关键页面；下面对 Atoms 的描述均为**官方文档宣称**，没有使用用户账号、没有提交生成、没有发布，不代表账号实测或所有套餐可用。
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
| 高 | 当前文件“加入聊天” | 用户能准确说清要改哪个文件，也使多 Agent 交互更实用 | 引用存在的文件；发送后明确作为上下文；历史版本引用不误指当前 | 小 |
| 高 | 版本改动摘要 / Diff | 用户能判断 AI 到底做了什么，支持恢复决策 | 比较新增/修改/删除文件；只读，不更改当前/发布指针 | 小至中 |
| 高 | 下载源码 ZIP | 让成果可交付且不锁在平台里，适合演示题 | 导出当前确认版本；保留文件路径；包含运行说明；不夹带 builder 密钥 | 小 |
| 中 | 从自己的历史版本 Remix | 让用户探索另一种方案，复用已有快照结构 | 不公开原项目；新项目归当前用户；不复制私密历史消息 | 小至中 |
| 中 | 一个待执行消息 | 长任务时不丢新想法，比完整排序队列简单 | 当前成功后只运行一次；失败暂停队列；可取消；刷新行为有定义 | 中 |
| 中 | 点选元素加入聊天 | 比增加更多角色更直观地体现创新性 | 选中元素可见；发送 DOM 标识/文字/允许的样式上下文；退出恢复正常点击；保存为新版本 | 中 |
| 后做 | 手动代码编辑 | 增加精细控制，但需解决 AI 编辑冲突 | 草稿可预览；保存新版本；Discard 恢复；生成时禁改 | 中至大 |

不要在这些功能前再铺更多静态按钮。评分依据是用户能完成任务和异常能恢复，不是界面入口数量。

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

## 后续实测建议

若后续用自己的账号体验，优先只做一个小项目：普通生成 → 指定一个文件或元素修改 → 对比版本 → Restore → Remix → 查看发布面板。逐项区分入口可见、可点击、操作成功、结果验证；付费/套餐限制单独记录，不把文档功能直接算作账号可用功能。本轮未执行此步骤。
