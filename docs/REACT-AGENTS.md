# Independent ReAct Agents — M19

2026-10-10。本轮由用户明确要求使用 Vercel AI SDK 重写，且每个子 Agent 拥有独立 ReAct loop。

## 架构

- `lib/llm/models.ts`：AI SDK OpenAI-compatible provider，保留 InsForge/OpenRouter 环境变量。应用后端不再通过旧 `LLM.stream` 调用单次文本生成。
- `lib/agents/orchestrator.ts`：Mike 与每次 Emma/Bob/Alex 委派分别创建独立 `ToolLoopAgent`。每个 SDK 实例维护自己的工具消息历史；协调器仅接收结构化产物和简短结果，不拼接子 Agent 的私有对话。
- Mike 工具：inspectProject/readFile/defineRequirements/planArchitecture/buildApp/finishTask。新建必须得到需求、计划和已检查候选；已有应用可跳过不必要的角色。
- Emma 工具：inspectProject/readFile/validateRequirements/submitRequirements。3–6 条契约通过校验后才能提交；既有条目不能被静默改写。
- Bob 工具：inspectProject/readFile/validatePlan/submitPlan。检查入口、文件数量、路径和已有文件覆盖后提交。
- Alex 工具：inspectProject/readFile/writeFile/checkApp/finishBuild。在请求内存的候选快照读写，checkApp 返回真实静态结果，模型根据失败继续行动。每次写入使旧检查失效；没有最新检查和实际改动不能提交。
- 生成接口保留鉴权、原子配额、请求指纹、版本 CAS、事务保存与独立用量结算。工具轨迹写入已有 messages.meta，无数据库迁移。流式工具事件及历史恢复使用同一轨迹。

生成的源码只进入候选快照和既有 iframe，不在服务器执行。不向模型暴露主机目录、终端、数据库管理权限、任意网络、密钥或发布工具。

## 循环边界

Mike 12 步、Emma 8 步、Bob 8 步、Alex 24 步；整任务最多 56 个模型步骤、160 次可执行工具调用、8 次委派、240 秒。累计已报告 token 到 500,000 后停止（先后从 100,000、300,000 调高：一个三文件应用的真实生成用了约 12 万，多轮修改后应用变大，每步重发的上下文也变大）；这是步骤间阈值，不是服务端账单硬上限，可能超出一个在途调用。模型输出上限为 Alex 每次 20,000（约可整写 60KB，且能在任务时限内写完；更大的文件靠 editFile 局部修改），其他角色 4,500 token。Alex 另有 `editFile`，按唯一匹配的原文片段做局部替换，小改动不必重写整个文件。体验账号最多同时 6 个构建，个人账号 3 个；崩溃未结算的构建 5 分钟后不再占名额。

工具在每个角色内部串行执行，即使模型错误地批量请求，也不能在 finish 后继续改候选。取消传递到父子 SDK 请求；异常、预算耗尽、未调用有效完成工具均不会创建版本。工具 schema 拒绝无效参数；验证工具进一步提供路径、资源等可修复错误。

全局配额是原来的用户每日生成次数，并非模型调用次数。多步 Agent 会增加单次生成的 token 和时延，应结合真实用量评估。中断的网关流若未报告 usage，无法从本地精确恢复其消耗。

## 已验证

- 121 项自动测试：SDK 实际执行工具循环，覆盖新建四角色、错误需求/计划修正、缺失资源反馈→补文件→再检查、过期检查拒绝、越界路径、不可削弱契约、角色工具权限、上下文隔离、批量写入串行化、总步数、时间限制与取消。
- 真实网关：新建（四角色）、小改动（Mike+Alex）、注入缺失脚本引用后修复（Mike+Alex）全部完成并通过静态检查。源码与逐角色工具轨迹见 [脱敏证据](react-agent-evidence.json)。本轮不将静态通过称为浏览器通过。
- 真实网关初次调试的两次运行因宽泛工具 schema 导致模型把契约作为字符串提交，连续校验失败后主动中止。修复为明确的嵌套 schema、完整示例和字段错误反馈后，三条 smoke 通过。这两次中止不是成功样本。
- 本地 HTTP 接口使用 mock 模型与真实认证/数据库：四角色工具事件、版本与契约保存、工具轨迹恢复、同 requestId 重放相同版本且不再调用模型通过；QA 项目已删除。
- 类型检查、lint、生产 build 通过。部署结果在本文件末尾补充。

真实网关三条 smoke 的新建约 32.8 秒（66,486 token）、小改动 18.0 秒（35,453 token）、修复 16.3 秒（32,649 token）。它们只是单次连通与功能证据，不是质量提升或统计显著性的证明。旧十任务实验仍是旧架构数据。

## 明确未做

- 服务端自动浏览器执行：现有 iframe 行为验收仍由用户触发，未接入 Alex 工具。checkApp 不执行 JavaScript，也不能检查点击效果、布局、持久化语义。
- Durable workflow/checkpoint：任务仍绑定当前请求；断线或进程退出不能从子 Agent 的某一步续跑。幂等恢复的是已保存结果。
- 完整新架构十任务对照与真实多轮浏览器自动修复实验。

## 复跑

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
# 只运行 SDK 模型/工具循环，不保存项目：
node --env-file=.env.local scripts/smoke-react.mjs --mock
node --env-file=.env.local scripts/smoke-react.mjs
# 本地服务器需 LLM_MOCK=1，认证/数据库仍是真实后端：
node --env-file=.env.local scripts/check-react-api.mjs
# 线上真实生成会计入该用户额度；可用 QA_EMAIL / QA_PASSWORD 指定授权测试账号：
node --env-file=.env.local scripts/check-react-api.mjs --app https://53bg3mbj.insforge.site --real
```

默认模型来自已有环境变量；不需要 Vercel AI Gateway，也没有改动平台或应用的发布权限。旧 `record` 参数现在明确返回 400，避免把多步工具循环误存成旧单轮文本 fixture。

## 部署后验证

- 运行时代码：`29addfdbf14cb86949f25d4fe6b81179174fb822`。
- InsForge deployment：`11cc9946-fb1a-4fdd-a1b1-e0e1d9d7abd0`，READY。
- 地址：https://53bg3mbj.insforge.site
- [GitHub CI](https://github.com/nomorekuiqian/atoms-demo/actions/runs/38038347688)：success，包含 Node 22 下的类型/lint/测试/build。
- 使用已有 QA 账号通过生产 `/api/generate` 发起真实模型请求：四角色成功、工具事件 SSE、版本与契约持久化、四角色轨迹恢复、同请求重放同版本且没有新 Agent 调用全部通过。请求完成后删除本次 QA 项目；没有发布该测试应用。
- 本地 QA 服务已停止。无数据库 schema/auth/RLS 变更。

生产接口成功证明新运行时在部署环境可执行与保存，不代表该生成应用的浏览器行为已经验收。
