import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { safeNext } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/insforge/server";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pb-16 pt-[12vh]">
      <Link href="/" aria-label="Atoms Lite home" className="rounded-sm">
        <Logo />
      </Link>
      <h1 className="mt-10 text-center font-serif text-display text-ink">Welcome</h1>
      <div className="mt-8 flex w-full justify-center">
        <LoginForm next={next} initialMode={params.mode === "signup" ? "signup" : "signin"} />
      </div>
    </div>
  );
}
