"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAuthActions } from "@insforge/sdk/ssr";
import { serverEnv } from "@/lib/env";
import { safeNext } from "./redirect";

export type AuthState = { error?: string; field?: "email" | "password" } | undefined;

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

function friendly(message: string | undefined, mode: "signin" | "signup"): string {
  const m = (message ?? "").toLowerCase();
  if (mode === "signup" && (m.includes("exist") || m.includes("already") || m.includes("duplicate"))) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (mode === "signin" && (m.includes("invalid") || m.includes("credential") || m.includes("password") || m.includes("not found"))) {
    return "Email or password is incorrect.";
  }
  return message || "Something went wrong. Try again.";
}

async function authWithPassword(mode: "signin" | "signup", formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: issue.path[0] as "email" | "password" };
  }
  const auth = createAuthActions({ cookies: await cookies() });
  const { error } =
    mode === "signup" ? await auth.signUp(parsed.data) : await auth.signInWithPassword(parsed.data);
  if (error) return { error: friendly(error.message, mode) };
  redirect(safeNext(formData.get("next")));
}

export async function signIn(_prev: AuthState, formData: FormData) {
  return authWithPassword("signin", formData);
}

export async function signUp(_prev: AuthState, formData: FormData) {
  return authWithPassword("signup", formData);
}

/** One-click shared demo account. The password never leaves the server. */
export async function signInDemo(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const env = serverEnv();
  if (!env.DEMO_EMAIL || !env.DEMO_PASSWORD) return { error: "The demo account isn't available right now." };
  const auth = createAuthActions({ cookies: await cookies() });
  const { error } = await auth.signInWithPassword({ email: env.DEMO_EMAIL, password: env.DEMO_PASSWORD });
  if (error) return { error: "The demo account isn't available right now." };
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
  redirect("/");
}
