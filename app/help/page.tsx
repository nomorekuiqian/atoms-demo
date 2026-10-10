import type {Metadata} from "next";
import {AppShell} from "@/components/app/app-shell";
import {getCurrentUser} from "@/lib/insforge/server";
import {HelpContent} from "./help-content";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Help · Atoms Lite"};
export default async function HelpPage(){return <AppShell user={await getCurrentUser()} title="Help"><main className="mx-auto max-w-[840px] px-4 pb-20 pt-10 sm:px-8"><h1 className="font-serif text-display">How can we help?</h1><p className="mt-3 text-base text-ink-2">Practical answers for your first build and your next change.</p><HelpContent/></main></AppShell>}
