import "server-only";
import type { Files } from "@/lib/agents/types";
import { insforgeAdmin } from "@/lib/insforge/admin";
import { SLUG_PATTERN } from "@/lib/publish/slug";

export type PublishedApp = { projectId: string; title: string; slug: string; updatedAt: string; files: Files };

/** Published apps, newest first. Only public fields and the published snapshot leave the server. */
export async function listPublished(limit = 24): Promise<PublishedApp[]> {
  const db = insforgeAdmin().database;
  const { data } = await db
    .from("projects")
    .select("id, title, published_slug, updated_at, published:versions!projects_published_version_fk(files)")
    .not("published_slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  type Row = { id: string; title: string; published_slug: string; updated_at: string; published: { files: Files } | null };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.published)
    .map((r) => ({ projectId: r.id, title: r.title, slug: r.published_slug, updatedAt: r.updated_at, files: r.published!.files }));
}

export async function getPublished(slug: string): Promise<PublishedApp | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const db = insforgeAdmin().database;
  const { data } = await db
    .from("projects")
    .select("id, title, published_slug, updated_at, published:versions!projects_published_version_fk(files)")
    .eq("published_slug", slug)
    .maybeSingle();
  const row = data as unknown as { id: string; title: string; published_slug: string; updated_at: string; published: { files: Files } | null } | null;
  if (!row?.published) return null;
  return { projectId: row.id, title: row.title, slug: row.published_slug, updatedAt: row.updated_at, files: row.published.files };
}
