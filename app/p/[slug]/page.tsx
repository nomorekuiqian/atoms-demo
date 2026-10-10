import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { AppFrame } from "@/components/app-frame";
import type { Files } from "@/lib/agents/types";
import { insforgeAdmin } from "@/lib/insforge/admin";
import { SLUG_PATTERN } from "@/lib/publish/slug";

export const dynamic = "force-dynamic";

/** Published version by slug. Read with the admin key; only the published snapshot leaves the server. */
async function load(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return null;
  const db = insforgeAdmin().database;
  const { data: project } = await db
    .from("projects")
    .select("title, published_version_id")
    .eq("published_slug", slug)
    .maybeSingle();
  if (!project?.published_version_id) return null;
  const { data: version } = await db.from("versions").select("files").eq("id", project.published_version_id).maybeSingle();
  if (!version) return null;
  return { title: project.title as string, files: version.files as Files };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const app = await load((await params).slug);
  return { title: app ? `${app.title} · Atoms Lite` : "Not found · Atoms Lite" };
}

export default async function PublishedApp({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await load(slug);
  if (!app) notFound();
  return (
    <>
      <AppFrame files={app.files} storageKey={`atoms-lite:published:${slug}`} title={app.title} />
      <Link
        href="/"
        className="fixed bottom-3 right-3 z-10 inline-flex h-7 items-center gap-1.5 rounded-full border bg-surface px-2.5 text-xs font-medium text-ink-2 shadow-sm transition-colors hover:text-ink"
      >
        <LogoMark className="size-3.5" />
        Made with Atoms Lite
      </Link>
    </>
  );
}
