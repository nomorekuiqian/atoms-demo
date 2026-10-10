"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-display text-ink">Something went wrong</p>
      <p className="mt-3 text-base text-ink-2">Your projects are safe. Try again, or go back home.</p>
      <div className="mt-6 flex gap-2">
        <Button variant="primary" onClick={reset}>Try again</Button>
        <Button asChild variant="secondary"><Link href="/">Go home</Link></Button>
      </div>
    </main>
  );
}
