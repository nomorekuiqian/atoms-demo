// Atomic project creation and remix against the configured backend.
// Usage: node --env-file=.env.local scripts/check-atomic-create.mjs   (demo account; cleans up its projects)
import { createAdminClient, createClient } from "@insforge/sdk";

const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
const user = createClient({ baseUrl: url, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY });
const admin = createAdminClient({ baseUrl: url, apiKey: process.env.INSFORGE_API_KEY }).database;
const { data: s, error } = await user.auth.signInWithPassword({ email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD });
if (error) throw error;
const uid = s.user.id;
const ok = (cond, label) => { console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); if (!cond) process.exitCode = 1; };
const count = async title => (await admin.from("projects").select("id").eq("owner_id", uid).eq("title", title)).data?.length ?? -1;
const created = [];

const title = `Atomic check ${Date.now().toString(36)}`;
const r = await admin.rpc("create_project_with_prompt", { p_user: uid, p_title: title, p_prompt: "Build a tiny timer" });
ok(!r.error && typeof r.data === "string", `create returns a project id (${JSON.stringify(r.data ?? r.error?.message)})`);
if (typeof r.data === "string") created.push(r.data);
const msgs = (await admin.from("messages").select("role,content").eq("project_id", r.data)).data ?? [];
ok(msgs.length === 1 && msgs[0].role === "user" && msgs[0].content === "Build a tiny timer", "prompt saved with the project");
const owner = (await admin.from("projects").select("owner_id").eq("id", r.data).maybeSingle()).data;
ok(owner?.owner_id === uid, "project owned by the signed-in user");

const badTitle = `${title} bad`;
const bad = await admin.rpc("create_project_with_prompt", { p_user: uid, p_title: badTitle, p_prompt: "x".repeat(4001) });
ok(!!bad.error && (await count(badTitle)) === 0, "a rejected prompt leaves no project");

const direct = await user.database.rpc("create_project_with_prompt", { p_user: uid, p_title: `${title} direct`, p_prompt: "x" });
ok(!!direct.error, `signed-in clients cannot call the function directly (${direct.error?.message?.slice(0, 60)})`);

const pub = (await admin.from("projects").select("published_slug,title").not("published_slug", "is", null).not("published_version_id", "is", null).limit(1)).data?.[0];
if (!pub) ok(false, "a published app exists for the remix check");
else {
  const m = await admin.rpc("remix_published", { p_user: uid, p_slug: pub.published_slug });
  ok(!m.error && typeof m.data === "string", `remix of /p/${pub.published_slug} returns a project id`);
  if (typeof m.data === "string") created.push(m.data);
  const p = (await admin.from("projects").select("title,current_version_id,remixed_from").eq("id", m.data).maybeSingle()).data;
  const v = (await admin.from("versions").select("id,number").eq("project_id", m.data)).data ?? [];
  const mm = (await admin.from("messages").select("role,version_id").eq("project_id", m.data)).data ?? [];
  ok(p?.remixed_from && v.length === 1 && p.current_version_id === v[0].id && mm.length === 1 && mm[0].version_id === v[0].id, "remix has one version, current pointer, provenance and a system message");
  const none = await admin.rpc("remix_published", { p_user: uid, p_slug: "no-such-app-zz" });
  ok(!none.error && none.data == null, "unknown slug creates nothing");
}

for (const id of created) await admin.from("projects").delete().eq("id", id);
ok((await admin.from("projects").select("id").in("id", created)).data?.length === 0, "cleanup");
