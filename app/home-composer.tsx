"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Composer } from "@/components/workspace/composer";
import { ThemePicker } from "@/components/app/theme-picker";
import { createProject } from "@/lib/projects/actions";
import { withTheme } from "@/lib/themes";

const EXAMPLES: [string, string][] = [
  ["Pomodoro timer", "Build a pomodoro timer with a count of sessions finished today"],
  ["Expense tracker", "Build an expense tracker with categories and a monthly total"],
  ["Snake game", "Build a classic snake game with a high score"],
  ["Personal homepage", "Build a one-page personal homepage with projects and contact links"],
];
const PENDING_KEY = "atoms-lite:pending-prompt";

export function HomeComposer({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [draft, setDraft] = React.useState("");
  const [theme, setTheme] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();

  const submit = React.useCallback(
    (prompt: string) => {
      setError(undefined);
      if (!signedIn) {
        try {
          sessionStorage.setItem(PENDING_KEY, prompt);
        } catch {}
        router.push(`/login?next=${encodeURIComponent("/?resume=1")}`);
        return;
      }
      startTransition(async () => {
        const result = await createProject(prompt);
        if (result?.error) setError(result.error);
      });
    },
    [router, signedIn],
  );

  // Back from login with a prompt typed while signed out: build it now.
  React.useEffect(() => {
    if (!signedIn || params.get("resume") !== "1") return;
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {}
    if (saved) {
      setDraft(saved);
      submit(saved);
    }
  }, [params, signedIn, submit]);

  return (
    <div className="w-full max-w-[720px]">
      <Composer
        size="lg"
        value={draft}
        onChange={setDraft}
        onSubmit={() => submit(withTheme(draft, theme))}
        footer={<ThemePicker value={theme} onChange={setTheme} />}
        busy={pending}
        textareaRef={inputRef}
        className="shadow-md"
        placeholder="Describe the app you want to build"
      />
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map(([label, prompt]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setDraft(prompt);
              inputRef.current?.focus();
            }}
            className="h-8 rounded-full border bg-surface px-3.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
