# 需求验收增强交付记录

基线：ff61e4a。范围：PLAN §7，M15–M18。进行中，不能据此宣称全量验收通过。

## M15 可靠性

- 103 项单测、lint、typecheck、生产构建通过。
- 隔离分支 acceptance-m15（schema-only）迁移通过；check-reliability.mjs：最后额度并发只有一份、独立用量幂等、RPC 浏览器拒绝、同时间戳稳定顺序、315 条消息无遗漏分页、并发上限与冲突用量保留通过。
- 原 check-atomic-runs.mjs 故障回滚/幂等/并发/所有权回归通过。
- 正常 token usage 只代表网关实际返回的 usage；中止前未返回 usage 时记录 usage_reported=false，额度预占仍保留。不能推算零成本。
- 老消息同时间戳的精确历史顺序已不可恢复；迁移按角色顺序和 ID 做确定性回填，新消息使用数据库序号。
- 资源支持：HTML/CSS/JS/SVG 单页，本地 SVG、CSS import/url、引号/无引号及归一化路径。多页 HTML 导航拒绝；JavaScript 动态 import/fetch 仍明确未检查。
- 页面切换身份隔离有单测；生产浏览器回归待部署后执行。

M15 生产：c66ca01，部署 272c34aa-77b1-4d96-9bb8-db1e19f99db4，READY，https://53bg3mbj.insforge.site 。

## M16 验收契约

- 108 单测、lint、类型及生产构建通过。
- 隔离数据库验证：finish_generation_v3 重放不改合同；浏览器不能直接伪造合同/观察；他人 RPC 读不到证据；Restore 复制契约但不复制通过状态。
- 小改动保持 Mike→Alex，继承旧项并新增人工确认项；大改动保留旧契约再补 Emma 新项。固定上限 24 项，超限明确要求人工复核，不静默宣称覆盖。
- 新 synthetic acceptance counter fixture 仅供回归，不是录制模型结果。

M16 生产：92b349b，部署 68bd09e4-4449-4eb1-9942-ef85b7996d87，READY。

## M17 受限行为观察

- 声明式点击/输入/文本/数量/属性/等待/刷新，只允许 ID/test ID；测试使用 opaque-origin iframe、独立内存存储、CSP 禁止连接/表单提交，保持原 sandbox 权限。
- 父窗口验证 iframe 来源、版本、随机会话和步骤 ID；每步限时、可停止；只保存经过校验的步骤结果，不保存通信字段。
- 浏览器真实执行：v105 三项通过；人为删除处理函数但保留按钮的 v106，增加和刷新检查失败，显示父版本通过→当前失败。Reset 原断言仅检查最终 0，出现弱断言通过，已明确记录；独立基准用例加入先增后减的中间断言。
- 在隔离后端点击 Repair this failure，以真实 Haiku 5.5 修复为 v107，随后三项重新通过。原始版本、失败证据和新版本均保留；没有自动无限修复。
- 验收截图：acceptance-repair-2026-10-10.jpg。数据为 synthetic fixture；修复调用是真实模型，不能混称整个项目为真实生成。
- 浏览器首次发现 transport 字段混入 strict evidence 被拒；已修复并新增回归测试。
- 同一生成 iframe 内的代码可能伪造观察信号，因此这里只称自动观察，不是独立安全证明。
