"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signInDemo, signInGoogle, signUp, type AuthState } from "@/lib/auth/actions";

export function LoginForm({ next, initialMode, oauthError }: { next: string; initialMode: "signin" | "signup"; oauthError?: string }) {
  const [mode, setMode] = React.useState(initialMode);
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "signin" ? signIn : signUp, undefined);
  const [demoState, demoAction, demoPending] = useActionState<AuthState, FormData>(signInDemo, undefined);
  const [googleState, googleAction, googlePending] = useActionState<AuthState, FormData>(signInGoogle, undefined);
  const busy = pending || demoPending || googlePending;

  return (
    <div className="w-full max-w-[360px]">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="flex justify-center">
        <TabsList>
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>
      </Tabs>

      <form action={googleAction} className="mt-8">
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" size="lg" className="w-full" loading={googlePending} disabled={busy}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.93a6 6 0 0 1 0-3.86V7.48H3.06a10 10 0 0 0 0 9.04l3.34-2.59Z" />
            <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59A5.99 5.99 0 0 1 12 5.95Z" />
          </svg>
          Continue with Google
        </Button>
        {(googleState?.error || oauthError) && (
          <FieldHint error role="alert" className="mt-2 text-center">{googleState?.error || oauthError}</FieldHint>
        )}
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-ink-3">
        <span className="h-px flex-1 bg-line" />or continue with email<span className="h-px flex-1 bg-line" />
      </div>

      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" aria-invalid={state?.field === "email" || undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            placeholder={mode === "signup" ? "At least 8 characters" : undefined}
            aria-invalid={state?.field === "password" || undefined}
          />
        </div>
        {state?.error && (
          <FieldHint error role="alert">
            {state.error}
          </FieldHint>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={pending} disabled={busy}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-ink-3">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={demoAction}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" size="lg" className="w-full" loading={demoPending} disabled={busy}>
          Try the demo account
        </Button>
        {demoState?.error && (
          <FieldHint error role="alert" className="mt-2 text-center">
            {demoState.error}
          </FieldHint>
        )}
      </form>
    </div>
  );
}
