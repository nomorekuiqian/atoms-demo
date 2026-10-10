// Run the actual SDK pipeline against the configured gateway, without writing a database or publishing.
// Usage: node --env-file=.env.local scripts/smoke-react.mjs [--mock]
import './load-project-ts.cjs';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { runPipeline } = require('../lib/agents/orchestrator.ts');
const { createGatewayModels } = require('../lib/llm/models.ts');
const { createFixtureModels } = require('../lib/llm/fixture-models.ts');
const fixture = require('../fixtures/new-acceptance-counter.json');
const { checkFiles } = require('../lib/checks/static.ts');
const mock = process.argv.includes('--mock');
if (!mock && !process.env.OPENROUTER_API_KEY) throw new Error('Configure the model gateway first.');
const models = { main: process.env.OPENROUTER_CHAT_MODEL || 'anthropic/claude-haiku-5.5', fast: process.env.OPENROUTER_FAST_MODEL || 'anthropic/claude-haiku-5.5' };
const report = { createdAt: new Date().toISOString(), mode: mock ? 'mock' : 'real', sdk: require('ai/package.json').version, models, cases: [] };
let files = {}, acceptance = { items: [] };
const tasks = mock ? [{ name: 'new', prompt: 'Build an acceptance counter.' }] : [
  { name: 'new', prompt: 'Build a compact counter with Add and Reset buttons and persistence after reload. Use index.html and app.js only, no CDN, no external resources, under 80 lines total. Define exactly 3 behavioral acceptance criteria. Keep descriptions short.' },
  { name: 'edit', prompt: 'Change the heading to My Daily Counter. Preserve all controls, selectors and persistence. This is a small copy edit.' },
  { name: 'fix', prompt: 'Fix the injected missing script reference and preserve the counter.', errors: ['The current index.html incorrectly references missing.js instead of app.js.'] },
];
await mkdir('.insforge', { recursive: true });
for (const task of tasks) {
  if (task.name === 'fix') files = { ...files, 'index.html': files['index.html'].replace(/app\.js/g, 'missing.js') };
  const input = { prompt: task.prompt, history: [], files, acceptance, mode: task.name === 'fix' ? 'fix' : 'build', errors: task.errors, requestId: crypto.randomUUID() };
  const modelFor = mock ? createFixtureModels(fixture, { hasApp: Object.keys(files).length > 0 }) : createGatewayModels({ baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY });
  const started = Date.now();
  const gen = runPipeline(input, { modelFor, models });
  let result;
  // Latency of user-visible feedback: first model output, first file content, and
  // how many file deltas arrived before that write was executed.
  const timing = { firstModelOutputMs: null, firstTextMs: null, firstFileDeltaMs: null, firstWriteExecMs: null, fileDeltas: 0, deltasBeforeFirstWrite: 0, fileAborts: 0 };
  for (;;) {
    const next = await gen.next();
    if (next.done) { result = next.value; break; }
    const e = next.value, at = Date.now() - started;
    if ((e.type === 'text_delta' || e.type === 'tool_activity' || e.type === 'file_delta') && timing.firstModelOutputMs === null) timing.firstModelOutputMs = at;
    if (e.type === 'text_delta' && timing.firstTextMs === null) timing.firstTextMs = at;
    if (e.type === 'file_delta') { timing.fileDeltas++; if (timing.firstWriteExecMs === null) timing.deltasBeforeFirstWrite++; timing.firstFileDeltaMs ??= at; }
    if (e.type === 'tool_activity' && e.tool === 'writeFile' && e.status !== 'running' && timing.firstWriteExecMs === null) timing.firstWriteExecMs = at;
    if (e.type === 'file_abort') timing.fileAborts++;
    if (e.type === 'agent_start' || e.type === 'agent_end') console.log(task.name, e.type, e.agent, e.status || '');
    if (e.type === 'tool_activity' && e.status !== 'running') console.log(task.name, e.agent, e.tool, e.status, 'step', e.step, e.detail || '');
    if (e.type === 'error') console.log(task.name, e.message);
  }
  const nextFiles = result.ok ? { ...files, ...result.written } : files;
  report.cases.push({ name: task.name, elapsedMs: Date.now() - started, timing, result, static: checkFiles(nextFiles), files: nextFiles, browser: 'not_run' });
  await writeFile(`.insforge/react-smoke-${mock ? 'mock' : 'real'}.json`, JSON.stringify(report, null, 2), { mode: 0o600 });
  if (!result.ok) { process.exitCode = 1; break; }
  files = nextFiles; acceptance = result.acceptance;
  console.log(task.name, 'timing', JSON.stringify(timing));
  console.log(task.name, 'COMPLETE', Date.now() - started, 'ms', result.usage.reduce((n,u) => n+u.input+u.output,0), 'tokens');
}
