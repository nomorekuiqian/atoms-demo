// T12: user B must not see or touch user A's project. Creates two throwaway accounts.
import { createClient } from "@insforge/sdk";

const base = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const app = process.argv[2] ?? "http://localhost:3000";
const stamp = Date.now();

async function user(tag) {
  const client = createClient({ baseUrl: base, anonKey });
  const email = `rls-${tag}-${stamp}@example.com`;
  const password = `Pw-${stamp}-${Math.random().toString(36).slice(2)}`;
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(`signUp ${tag}: ${error.message}`);
  return { client, token: data.accessToken, id: data.user.id };
}

const a = await user("a");
const b = await user("b");
const ok = (cond, label) => console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);

const { data: proj, error } = await a.client.database.from("projects").insert([{ title: "A's secret" }]).select("id").single();
if (error) throw error;
await a.client.database.from("messages").insert([{ project_id: proj.id, role: "user", content: "hello" }]);

const seenByB = await b.client.database.from("projects").select("id").eq("id", proj.id);
ok(!seenByB.error && seenByB.data.length === 0, "B cannot select A's project");
const msgsByB = await b.client.database.from("messages").select("id").eq("project_id", proj.id);
ok(!msgsByB.error && msgsByB.data.length === 0, "B cannot select A's messages");
const upd = await b.client.database.from("projects").update({ title: "pwned" }).eq("id", proj.id).select("id");
ok((upd.data ?? []).length === 0, "B cannot rename A's project");
const ins = await b.client.database.from("messages").insert([{ project_id: proj.id, role: "user", content: "x" }]);
ok(Boolean(ins.error), "B cannot insert messages into A's project");
const spoof = await b.client.database.from("projects").insert([{ title: "spoof", owner_id: a.id }]);
ok(Boolean(spoof.error), "B cannot create a project owned by A");
const pub = await a.client.database.from("projects").update({ published_slug: "sneaky-slug" }).eq("id", proj.id);
ok(Boolean(pub.error), "Owner cannot set published_slug directly (server-only)");
const del = await b.client.database.from("projects").delete().eq("id", proj.id).select("id");
ok((del.data ?? []).length === 0, "B cannot delete A's project");

const page = await fetch(`${app}/project/${proj.id}`, { headers: { cookie: `insforge_access_token=${b.token}` }, redirect: "manual" });
ok(page.status === 404, `B gets 404 on /project/<A's id> (got ${page.status})`);
const own = await fetch(`${app}/project/${proj.id}`, { headers: { cookie: `insforge_access_token=${a.token}` }, redirect: "manual" });
ok(own.status === 200, `A gets 200 on own project (got ${own.status})`);

await a.client.database.from("projects").delete().eq("id", proj.id);
