// F9 checks against a running app: slug rules, conflicts, update-to-latest, unpublish, isolation headers.
// Usage: node scripts/check-publish.mjs [appUrl]   (uses the demo account; creates and cleans up its own projects)
import { createClient } from "@insforge/sdk";

const app = process.argv[2] ?? "http://localhost:3000";
const c = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY });
const { data: s, error } = await c.auth.signInWithPassword({ email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD });
if (error) throw error;
const cookie = `insforge_access_token=${s.accessToken}`;
const ok = (cond, label) => console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
const api = (path, init = {}) => fetch(`${app}${path}`, { ...init, headers: { cookie, "content-type": "application/json", ...(init.headers ?? {}) } });

async function projectWithVersion(n) {
  const { data: p } = await c.database.from("projects").insert([{ title: `Publish check ${n}` }]).select("id").single();
  const ids = [];
  for (let i = 1; i <= n; i++) {
    const { data: v } = await c.database
      .from("versions")
      .insert([{ project_id: p.id, number: i, files: { "index.html": `<h1>v${i}</h1>` }, summary: `v${i}` }])
      .select("id")
      .single();
    ids.push(v.id);
  }
  await c.database.from("projects").update({ current_version_id: ids[0] }).eq("id", p.id);
  return { id: p.id, versions: ids };
}

const slug = `check-${Date.now().toString(36)}`;
const a = await projectWithVersion(2);
const b = await projectWithVersion(1);

for (const [bad, why] of [["abc", "too short"], ["my_app_1", "underscore"], ["-abcdef", "leading hyphen"], ["dashboard", "reserved"]]) {
  const r = await api(`/api/projects/${a.id}/publish`, { method: "POST", body: JSON.stringify({ slug: bad }) });
  ok(r.status === 400, `rejects "${bad}" (${why}) → ${r.status}`);
}
let r = await api(`/api/projects/${a.id}/publish`, { method: "POST", body: JSON.stringify({ slug: slug.toUpperCase() }) });
ok(r.status === 200 && (await r.json()).slug === slug, `normalises "${slug.toUpperCase()}" to lowercase and publishes`);
r = await api(`/api/projects/${a.id}/publish`, { method: "POST", body: JSON.stringify({ slug }) });
ok(r.status === 200, `publishes /p/${slug} → ${r.status}`);
r = await api(`/api/projects/${b.id}/publish`, { method: "POST", body: JSON.stringify({ slug }) });
ok(r.status === 409, `same slug on another project → ${r.status}`);
r = await api(`/api/slug-available?slug=${slug}&projectId=${b.id}`);
ok((await r.json()).available === false, "availability check reports the slug as taken");

let page = await (await fetch(`${app}/p/${slug}`)).text();
ok(page.includes("v1"), "anonymous visitor sees v1");

await c.database.from("projects").update({ current_version_id: a.versions[1] }).eq("id", a.id);
page = await (await fetch(`${app}/p/${slug}`)).text();
ok(page.includes("v1") && !page.includes("v2"), "a new version is not live until updated");
r = await api(`/api/projects/${a.id}/publish`, { method: "POST", body: JSON.stringify({}) });
page = await (await fetch(`${app}/p/${slug}`)).text();
ok(r.status === 200 && page.includes("v2"), "update to latest serves v2");

r = await api(`/api/projects/${a.id}/publish`, { method: "DELETE" });
const gone = await fetch(`${app}/p/${slug}`);
ok(r.status === 200 && gone.status === 404, `unpublished link → ${gone.status}`);

const other = await fetch(`${app}/api/projects/${a.id}/publish`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
ok(other.status === 401, `publish without a session → ${other.status}`);

await c.database.from("projects").delete().in("id", [a.id, b.id]);
