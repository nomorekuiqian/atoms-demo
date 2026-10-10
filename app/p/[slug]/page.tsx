import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { AppFrame } from "@/components/app-frame";
import {cache} from "react";
import {getPublished} from "@/lib/remix/load";

export const dynamic = "force-dynamic";

/** One public snapshot read shared by metadata and page rendering. */
const load=cache(getPublished);

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
      <div className="fixed bottom-3 right-3 z-10 flex h-7 items-center rounded-full border bg-surface text-xs font-medium text-ink-2 shadow-sm">
        <Link href="/" className="inline-flex h-full items-center gap-1.5 rounded-l-full pl-2.5 pr-2 transition-colors hover:text-ink">
          <LogoMark className="size-3.5" />
          Made with Atoms Lite
        </Link>
        <span className="h-3 w-px bg-line-strong" aria-hidden />
        <Link href={`/remix/${slug}`} className="inline-flex h-full items-center rounded-r-full pl-2 pr-2.5 transition-colors hover:text-ink">
          Remix
        </Link>
      </div>
    </>
  );
}
