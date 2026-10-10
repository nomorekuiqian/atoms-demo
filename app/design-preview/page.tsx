import { notFound } from "next/navigation";
import { Specimen } from "./specimen";

// Development-only design system specimen (milestone D0).
export default async function DesignPreviewPage({ searchParams }: { searchParams: Promise<{ theme?: string; tab?: string; pane?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { theme, tab, pane } = await searchParams;
  return (
    <Specimen
      initialTheme={theme === "dark" ? "dark" : "light"}
      initialTab={tab === "code" || tab === "versions" ? tab : "preview"}
      initialPane={pane === "app" ? "app" : "chat"}
    />
  );
}
