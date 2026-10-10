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
