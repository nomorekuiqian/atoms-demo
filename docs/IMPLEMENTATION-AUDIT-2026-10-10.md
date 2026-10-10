# Atoms Lite 实现审计与验收差距

日期：2026-10-10（Asia/Taipei）。这是本次对话中代码与线上页面审计的存档，不是修复完成记录。

## 审计边界

- 基线提交：`8a03787 feat: iterate & publish`。审计开始时工作区干净；过程中出现其他进行中的修改，不能把本报告视作最新工作区的最终验收。
- 对照：`AGENTS.md`、`docs/PRD.md` §7 验收标准、§1.3 评分维度、`docs/PLAN.md`。
- 范围：首页、登录、Dashboard、工作台、发布面板；生成编排、流式解析、持久化、沙箱和权限相关代码。
- 线上观察：体验账号登录、已有 Pomodoro Timer 项目、Console、Versions、桌面和 375px 工作台。未触发新模型生成、修改项目或发布。
- 上一轮本地检查：59 项单测、typecheck、lint、生产 build 全通过；线上首页 HTTP 200。这些结果属于当时基线，不替代后续修改的回归。
- 本轮临时诊断：4 个用例复现截断输出、提前 EOF、部分保存失败、修复 fixture 无效。测试文件位于临时目录，不加入正式测试集。

## 结论

M0–M4 的主要页面和正常流程已实现；异常恢复与状态一致性仍存在缺口，不能仅凭正常路径或单测通过判定 PRD 全面验收。优先修复可靠性，再完成 E2/E1 和最终交付。

## 缺陷清单

### A1 高优先：截断输出仍可能判成功，前后端文件不一致

- 触发：模型完整输出 index.html，但 app.js 未闭合。
- 后端 `lib/agents/orchestrator.ts` 仅保留完整文件；只要有一个完整文件且 merge 校验通过，就返回 ok。非法/未完成文件仅被日志记录。
- 前端 `lib/store/workspace.ts` 在 version_created 中直接合并全部 draft，包含半截 app.js。
- 影响：预览可能运行坏代码，刷新后又恢复成数据库里另一份代码；违背 F4⑥、F5④、F8。
- 证据：本地诊断复现，后端只返回 index.html，而前端 app.js 为 `function broken(`。
- 建议：截断文件使本轮失败；成功状态与服务端确认的文件快照一致。

### A2 高优先：保存失败时当前版本可能已经更新

- 位置：`lib/agents/persist.ts` 的版本插入及 Promise.all 写入。
- 触发：项目 current_version_id 更新成功，messages 写入失败。
- 影响：接口报错并宣称旧版本未变，但数据库已经指向新版本；刷新和重试行为不一致。对应 F4⑥、F8。
- 证据：本地故障注入，persistRun 抛错时 current_version_id 已由 v1 变为 v2。
- 建议：版本、消息和项目指针事务提交；明确用量写入与业务提交的失败策略。

### A3 高优先：断网重试可能执行上一条需求

- 位置：`components/workspace/workspace.tsx` 的 onRetry；`app/api/generate/route.ts` 的省略 prompt 分支。
- 触发：新需求在前端已显示，但请求未到服务器或用户消息写库失败。重试固定发送 prompt:null，服务端选择数据库最后一条用户消息。
- 影响：用户重试“按钮改大”，实际可能再次执行上一条“改暗色”。对应 F7、M6 断网重试验收。
- 证据：代码路径确认，未在生产制造断网。
- 建议：保存完整请求参数与唯一请求标识；重试同一请求，服务端幂等去重。

### A4 中优先：提前 EOF 没有错误说明和重试入口

- 位置：`components/workspace/workspace.tsx` 的 readEvents 循环；`lib/store/workspace.ts` 的 finishRun。
- 触发：SSE 没有收到完整终止事件，响应流就平静关闭。
- 影响：角色变为 failed，但 runError 为空，不显示 Try again。对应 F4⑥。
- 证据：本地状态复现。
- 建议：验证终止事件，缺失时提示中断；必要时重新同步服务端已保存结果。

### A5 高优先：读取失败被当作空项目或空历史

- 位置：`lib/agents/persist.ts` 的 loadProjectState/loadHistory；`app/project/[id]/page.tsx`。
- 触发：当前版本、消息或版本列表查询失败，代码忽略 error 并使用空对象/空数组。
- 影响：已有应用可能按全新项目生成；工作台可能展示为空，误导用户以为数据丢失。对应 F7/F8 及 AGENTS.md 的 SDK error 检查要求。
- 证据：代码确认。
- 建议：区分真实空数据与查询失败；读取失败必须停止生成并允许重试。

### A6 中优先：发布校验网络失败后可能持续禁用

- 位置：`components/workspace/publish-dialog.tsx` 的 useSlugCheck/unpublish。
- 触发：slug 校验请求失败，catch 没有离开 checking 状态；Publish 按钮在 checking 时禁用。
- 影响：恢复网络后仍需改输入或重开弹窗；下线请求网络异常缺少 catch，也没有稳定的用户反馈。
- 证据：代码确认，未在线上修改发布状态。
- 建议：增加检查失败/重试状态或允许服务端最终校验；统一下线网络错误提示。

## 功能和示例缺口（审计时快照）

| 项目 | 审计时状态 | 验收影响 |
|---|---|---|
| E1 Versions/Restore/Revert | 列表已有，工作台未接 onView/onRestore，无完整恢复流程 | E1、T6 未完成 |
| E2 Issue Report/Resolve | 线上无入口；审计期间本地正在接入 | E2、T7 待验收 |
| 修复 fixture | edit-fix 仅改 HTML，保留 JS 中未定义 skipSession | 即使接通 Resolve，Mock 修复链也失败 |
| 工作台加载与失败 | 无完整加载骨架，查询失败可能被显示为空 | 状态体验不完整 |
| 最终材料 | 缺完整线上用例记录、GIF 和精选示例链接 | M7 未完成 |

### 线上观察到的具体问题

体验账号的 Pomodoro Timer v3（项目 `af811580-e938-4818-b34d-9480393b2a69`）标记为 Published；打开工作台即出现 `ReferenceError: skipSession is not defined`，来自初始化绑定事件。没有 Resolve 入口，仅 Console 红点。该错误与仓库故意报错 fixture 一致；不能据此推断真实模型整体质量，但不适合作为交付示例。

将 `fixtures/edit-broken.json` 和 `fixtures/edit-fix.json` 按实际文件覆盖规则合并执行，仍出现同一错误：修复 fixture 只修改 index.html，app.js 的未定义函数引用没有被修复。

体验账号项目列表混有 Smoke test、Draft 和重复项目。建议交付前整理并保留三个确认可用的示例；本轮没有删除或修改这些项目。

## 按评分维度的建议

PRD 没有数值权重，不虚构总分。

| 维度 | 已有优势 | 改进重点 |
|---|---|---|
| 完成度 | 注册→生成→迭代→预览→发布主流程已实现 | 异常恢复，E1/E2 完整接通 |
| 工程思维 | 编排器独立、解析器、RLS、Mock、单测 | 事务一致性、幂等重试、完整流协议 |
| 用户体验 | 简洁双栏，375px Chat/App 可切换 | 直接修复入口，清晰加载与失败状态，无误导成功提示 |
| 创新性 | 多角色过程可视化 | 报错→修复→历史恢复的完整演示 |
| 可交付性 | 在线站点和基本 README | 三个可用示例、真实模型验收记录、GIF、取舍与完成度 |

## 建议执行顺序

1. 修 A1/A2/A3/A5，补针对性回归；再修 A4/A6。
2. 完成 E2 和 E1；修复 fixture，跑 T7/T6。
3. 准备三个真实可用示例，整理体验账号。
4. 真实线上 T1–T13；T3 连跑三次至少成功两次；记录耗时、额度与已知限制。
5. README/GIF、干净目录启动、最终交付检查。

## 后续状态更新规则

发现不是修复，存在组件不是用户流程可用，本地修改不是部署完成。后续修复应补提交、检查结果和线上验收记录。2026-10-10 本文保存时，工作区又出现 Restore、Discover、Remix、主题等进行中的修改；这些进展需要重新检查，不能沿用上表直接判定缺失或完成。
