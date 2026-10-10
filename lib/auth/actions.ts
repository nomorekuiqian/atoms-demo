"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAuthActions } from "@insforge/sdk/ssr";
import { serverEnv } from "@/lib/env";
import { safeNext } from "./redirect";
import { OAUTH_NEXT_COOKIE, OAUTH_VERIFIER_COOKIE } from "./oauth";

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

export async function signInGoogle(_prev: AuthState, formData: FormData): Promise<AuthState> {
  // Next.js validates Server Action Origin against Host before running this action.
  const origin = (await headers()).get("origin");
  if (!origin || !/^https?:\/\//.test(origin)) return { error: "Please reload this page and try again." };
  const cookieStore = await cookies();
  let authorizationUrl: string;
  try {
    const auth = createAuthActions({ cookies: cookieStore });
    const { data, error } = await auth.signInWithOAuth("google", {
      redirectTo: new URL("/api/auth/callback", origin).toString(),
      skipBrowserRedirect: true,
    });
    if (error || !data?.url || !data.codeVerifier) {
      return { error: "Google sign-in is unavailable right now. Please try again." };
    }
    const options = { httpOnly: true, secure: new URL(origin).protocol === "https:", sameSite: "lax" as const, path: "/", maxAge: 600 };
    cookieStore.set(OAUTH_VERIFIER_COOKIE, data.codeVerifier, options);
    cookieStore.set(OAUTH_NEXT_COOKIE, safeNext(formData.get("next")), options);
    authorizationUrl = data.url;
  } catch {
    return { error: "Couldn't connect to Google sign-in. Please try again." };
  }
  redirect(authorizationUrl);
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
