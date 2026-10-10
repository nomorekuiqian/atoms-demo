import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import covers from "@/lib/assets/examples.json";
import { listPublished } from "@/lib/remix/load";
import { AppThumbnail } from "./app-thumbnail";

export async function HomeGallery() {
  let apps;
  try { apps = await listPublished(3); } catch {
    return <p className="py-8 text-sm text-ink-2">Examples couldn’t load. <Link className="underline" href="/discover">Try Discover</Link></p>;
  }
  if (!apps.length) return <p className="py-8 text-sm text-ink-2">Published apps will appear here. Build something and share it.</p>;
  return <ul className="grid gap-5 sm:grid-cols-3">
    {apps.map(app => <li key={app.projectId} className="min-w-0">
      <Link href={`/p/${app.slug}`} aria-label={`Open ${app.title}`} className="group block overflow-hidden rounded-lg border transition-colors hover:border-line-strong">
        <AppThumbnail files={app.files} title={app.title} cover={covers.find(c => c.captureProjectId === app.projectId && c.captureVersionId === app.versionId)?.outputPath.replace(/^public/, "")} />
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <Link href={`/p/${app.slug}`} className="text-sm font-medium text-ink hover:underline">{app.title}</Link>
        <Link href={`/remix/${app.slug}`} aria-label={`Remix ${app.title}`} className="flex min-h-8 shrink-0 items-center gap-1 text-sm text-ink-2 hover:text-ink">Remix<ArrowUpRight className="size-3.5" aria-hidden /></Link>
      </div>
    </li>)}
  </ul>;
}
