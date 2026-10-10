import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { HomeGallery } from "@/components/app/home-gallery";
import { AgentAvatar } from "@/components/workspace/agent-avatar";
import { AGENTS, type AgentId } from "@/lib/agents/meta";
import { getCurrentUser } from "@/lib/insforge/server";
import { HomeComposer } from "./home-composer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <AppShell user={user} title="Home">
      <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-8">
      <section id="build" aria-labelledby="build-heading" className="flex scroll-mt-6 flex-col items-center pt-2 sm:pt-4">
        <Image
          src="/assets/illustrations/build-still-life-v1.webp"
          alt=""
          aria-hidden="true"
          width={840}
          height={480}
          priority
          unoptimized
          draggable={false}
          className="pointer-events-none h-[120px] w-[210px] select-none object-contain sm:h-[144px] sm:w-[252px]"
        />
        <h1 id="build-heading" className="text-balance text-center font-serif text-display text-ink sm:text-display-lg">
          What should we build?
        </h1>
        <p className="mt-3 text-center text-base text-ink-2">Describe your idea. Your AI team takes it from here.</p>
        <div className="mt-6 flex w-full justify-center">
          <Suspense>
            <HomeComposer signedIn={Boolean(user)} />
          </Suspense>
        </div>
      </section>
      <section aria-labelledby="examples-heading" className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div><h2 id="examples-heading" className="text-xl font-semibold text-ink">Made with Atoms Lite</h2><p className="mt-1 text-sm text-ink-2">Try an app, or make it your own.</p></div>
          <Link href="/discover" className="flex shrink-0 items-center gap-1.5 text-sm text-ink-2 hover:text-ink">View all<ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <Suspense fallback={<div role="status"><span className="sr-only">Loading examples…</span><div aria-hidden className="grid gap-5 sm:grid-cols-3">{[0,1,2].map(i => <div key={i}><div className="aspect-[16/10] rounded-lg bg-surface-3" /><div className="mt-3 h-5 w-32 rounded-sm bg-surface-3" /></div>)}</div></div>}><HomeGallery /></Suspense>
      </section>
      <section id="team" aria-labelledby="team-heading" className="mt-12 scroll-mt-6 border-t pt-8">
        <div className="flex items-center justify-between gap-4"><h2 id="team-heading" className="text-xl font-semibold text-ink">Meet your AI team</h2><Link href="/team" className="text-sm text-ink-2 underline underline-offset-4">How the team works</Link></div>
        <p className="mt-1 text-sm text-ink-2">One idea, four specialists working together.</p>
        <ul className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {(Object.keys(AGENTS) as AgentId[]).map(agent => <li key={agent}>
            <div className="flex items-center gap-3"><AgentAvatar agent={agent} /><div><h3 className="text-sm font-medium text-ink">{AGENTS[agent].name}</h3><p className="text-xs text-ink-2">{AGENTS[agent].role}</p></div></div>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">{{mike:"Shapes your brief and brings in the right teammates.",emma:"Turns your idea into a clear list of features.",bob:"Plans the files and how the app fits together.",alex:"Writes the code and handles your next change."}[agent]}</p>
          </li>)}
        </ul>
      </section>
      <section id="help" aria-labelledby="help-heading" className="mt-12 scroll-mt-6 border-t pt-8">
        <h2 id="help-heading" className="mb-2 text-xl font-semibold text-ink">A little help getting started</h2><Link href="/help" className="mb-4 inline-block text-sm text-ink-2 underline underline-offset-4">Browse all help articles</Link>
        {[
          ["What can I build?", "Try a timer, tracker, small game or personal page. Apps run in your browser and can remember data on your device. Start with one clear purpose, then ask for changes."],
          ["How do I start from an example?", "Open an app to try it. Choose Remix to copy its code into your own project, then tell the team what to change. You’ll be asked to log in first."],
          ["Can I undo a change or share my app?", "Every completed build creates a version. Restore an earlier version, download your code, or use Publish in the workspace to create a public link."],
        ].map(([question,answer]) => <details key={question} className="group border-b py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">{question}<ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden /></summary><p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-ink-2">{answer}</p></details>)}
      </section>
      </main>
    </AppShell>
  );
}
