"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signInDemo, signUp, type AuthState } from "@/lib/auth/actions";

export function LoginForm({ next, initialMode }: { next: string; initialMode: "signin" | "signup" }) {
  const [mode, setMode] = React.useState(initialMode);
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "signin" ? signIn : signUp, undefined);
  const [demoState, demoAction, demoPending] = useActionState<AuthState, FormData>(signInDemo, undefined);

  return (
    <div className="w-full max-w-[360px]">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="flex justify-center">
        <TabsList>
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>
      </Tabs>

      <form action={action} className="mt-8 space-y-4" noValidate>
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
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={pending}>
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
        <Button type="submit" variant="secondary" size="lg" className="w-full" loading={demoPending}>
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
