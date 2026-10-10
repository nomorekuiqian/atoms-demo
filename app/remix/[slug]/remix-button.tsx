"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FieldHint } from "@/components/ui/input";
import { remix } from "@/lib/remix/actions";

export function RemixButton({ slug }: { slug: string }) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string>();
  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="primary"
        size="lg"
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await remix(slug);
            if (r?.error) setError(r.error);
          })
        }
      >
        Remix into my projects
      </Button>
      {error && <FieldHint error>{error}</FieldHint>}
    </div>
  );
}
