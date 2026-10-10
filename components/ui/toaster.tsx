"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-full !border !border-line !bg-ink !px-4 !py-2.5 !text-base !text-ink-on !shadow-md !font-sans !w-auto !gap-2",
          description: "!opacity-80",
        },
      }}
    />
  );
}
