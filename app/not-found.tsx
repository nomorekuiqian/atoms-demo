import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-display text-ink">Not found</p>
      <p className="mt-3 text-base text-ink-2">This page doesn’t exist or you don’t have access to it.</p>
      <Button asChild variant="primary" className="mt-6">
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
