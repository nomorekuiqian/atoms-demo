// Smoke test for /api/generate: signs in as the demo account, creates a project, streams a build.
// Usage: node scripts/smoke-generate.mjs "<prompt>" [--app http://localhost:3000] [--project <id>] [--record new-x --match a,b] [--abort-after 3]
import { createClient } from "@insforge/sdk";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const prompt = args[0]?.startsWith("--") ? undefined : args[0];
const app = flag("app", "http://localhost:3000");
const record = flag("record");
const match = flag("match")?.split(",");
const abortAfter = Number(flag("abort-after", 0));
const mode = flag("mode", "build");
const errors = flag("errors")?.split("|");

const client = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY });
const { data: session, error } = await client.auth.signInWithPassword({ email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD });
if (error) throw new Error(`sign in: ${error.message}`);

let projectId = flag("project");
if (!projectId) {
  const { data, error: e } = await client.database.from("projects").insert([{ title: "Smoke test" }]).select("id").single();
  if (e) throw e;
  projectId = data.id;
}
console.log(`project ${projectId}`);

const controller = new AbortController();
const started = Date.now();
const res = await fetch(`${app}/api/generate`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: `insforge_access_token=${session.accessToken}` },
  body: JSON.stringify({ projectId, prompt, record, match, mode, errors }),
  signal: controller.signal,
});
if (!res.ok) {
  console.log(`HTTP ${res.status}`, await res.text());
  process.exit(1);
}

let first;
const counts = {};
const decoder = new TextDecoder();
let buf = "";
try {
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) !== -1) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (!line.startsWith("data: ")) continue;
      const e = JSON.parse(line.slice(6));
      const t = ((Date.now() - started) / 1000).toFixed(1);
      if (e.type === "text_delta" && first === undefined) first = t;
      counts[e.type] = (counts[e.type] ?? 0) + 1;
      if (["agent_start", "agent_end", "file_start", "file_end", "version_created", "error", "done"].includes(e.type)) {
        console.log(`${t.padStart(6)}s  ${e.type} ${JSON.stringify({ ...e, type: undefined })}`);
      }
      if (abortAfter && e.type === "agent_start" && Date.now() - started > abortAfter * 1000) controller.abort();
      if (abortAfter && e.type === "file_start") controller.abort();
    }
  }
} catch (err) {
  if (err.name !== "AbortError") throw err;
  console.log("aborted by client");
}
console.log(`first text at ${first}s, total ${((Date.now() - started) / 1000).toFixed(1)}s`, counts);
