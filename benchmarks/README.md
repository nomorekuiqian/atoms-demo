# 验收对照实验

固定任务在 `acceptance-tasks.mjs`：4 新建、3 迭代、3 修复。两组使用相同 Haiku 5.5、温度 0.4、Alex 输出上限 12,000 token、相同输入文件和独立固定断言。完整任务与固定选择器都告知两组，断言不是隐藏测试。每任务交替调用顺序；仅各运行一次，无挑选最佳样本。直接组调用相同 Alex 提示模板；团队组调用产品真实路由（新建四角色、小改 Mike→Alex、修复 Alex）。两组的内部提示和总输入 token 不相同。

## 2026-10-10 结果

| 指标 | 直接 Alex | 团队流水线 |
|---|---:|---:|
| 首份产物通过全部固定行为检查 | 10/10 | 9/10 |
| 行为条目通过 | 30/30 | 28/30 |
| 迭代任务原功能保留 | 3/3 | 3/3 |
| 已知缺陷修复任务通过 | 3/3 | 3/3 |
| 生成接口/解析失败 | 0 | 0 |
| 输入 token | 23,666 | 41,890 |
| 输出 token | 16,865 | 21,749 |
| 平均生成时间 | 7.70 秒 | 11.85 秒 |

**本次未观察到多代理的生成质量优势。** 团队总 token 多约 57%，平均生成时间多约 54%。团队计算器引用 `style.css` 却没有输出它；静态检查和浏览器资源错误均能识别。失败产物保留，没有重新生成替换或计入修复后的成绩。

两个任务的四个产物先用于校准。完整运行暴露了执行器首次 iframe 显示前点击的误报；增加最多 1.8 秒的可操作状态等待后，对同一批 20 个产物全部重测。原始观察流水保留，包括校准与有缺陷执行器的结果；`results.json` 中每条最终证据来自修复执行器后的完整重测。此处“首份产物”指没有重试模型，不代表执行器没有校准。

## 证据与边界

- `results/2026-10-10/results.json`：配置、固定任务、实际文件、生成契约、用量、耗时、静态检查、最终逐步骤证据。
- `results/2026-10-10/observations.jsonl`：所有原始浏览器观察，保留失败与重测记录。
- `results/2026-10-10/regression-chain.json`：单独的 synthetic 基线→故意退化→真实模型修复快照与观察，不计入十任务对照。
- 人工介入：固定测试设计、执行器缺陷修正；没有人工修改这 20 个生成产物。
- 仅 10 个小任务，未测复杂长任务、视觉设计质量、完整业务需求或统计显著性；例如 todo 的空白输入拒绝没有纳入本轮固定断言。
- 生成器知道选择器和断言；可用于回归和成本比较，不能当作独立抗作弊评测。
- 浏览器结果由不可信生成 iframe 回传，属于诊断观察，不构成安全证明。
- 计费只报告网关实际返回 token；当前 CLI 不能读取剩余额度，未推算美元账单、未升级套餐。
- 创新交付证据来自“需求契约→版本→行为观察→退化提示→显式修复→再次检查”的可追溯闭环，不能用本实验宣传多代理天然优于单模型。

## 复跑

首次生成会消耗已配置网关额度。不要同时启动多个基准生成进程。已有同配置结果会续跑，配置变更须先归档原文件。

```bash
BENCHMARK_TASK_LIMIT=2 node --env-file=.env.local scripts/run-acceptance-benchmark.mjs
# 先校准四个产物；再扩到完整十任务
BENCHMARK_TASK_LIMIT=10 node --env-file=.env.local scripts/run-acceptance-benchmark.mjs
ENABLE_ACCEPTANCE_BENCHMARK=1 npm run dev
```

打开本机 `/dev/acceptance-benchmark`，点击 Run generated candidates。执行器复用产品隔离沙箱，但使用固定断言；逐步结果写入固定本地文件。生产环境路由始终 404，不开放任意脚本或文件写入。

```bash
node scripts/report-acceptance-benchmark.mjs
```

只重放已有产物可将归档的 `results.json` 复制到本地 `.insforge/acceptance-benchmark.json`，再启动开发页，不需要模型调用。部署不携带本地密钥或原始运行状态。


## ReAct 迁移后的实验边界

上文 2026-10-10 的 10 任务数据是旧固定流水线，不代表独立 ReAct 架构。新 `run-acceptance-benchmark.mjs` 默认写 `.insforge/acceptance-benchmark-react.json`，schema 2 / architecture `independent-react-v1`，拒绝混入旧结果。`report-acceptance-benchmark.mjs` 默认读取同一路径；两脚本均支持 `BENCHMARK_RESULT_FILE`。必须对新 versionId 重新采集浏览器观察，不能复用旧版通过记录。直接 Alex 仍使用历史单次生成作为基线，团队现在有多步预算，比较需同时报告总 token/延迟，不能声称两臂总预算相同。

本轮仅跑新建/小改动/修复三条真实网关 smoke 与接口保存验证，详见 `docs/REACT-AGENTS.md`；尚未重跑完整十任务对照。
