import { notFound } from "next/navigation";
import { insforgeServer } from "@/lib/insforge/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Placeholder until the workspace lands in M3.
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const db = (await insforgeServer()).database;
  const { data: project } = await db.from("projects").select("id, title").eq("id", id).maybeSingle();
  if (!project) notFound();
  const { data: messages } = await db
    .from("messages")
    .select("id, role, content")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-[720px] px-4 py-10">
      <h1 className="text-2xl font-semibold">{project.title}</h1>
      <ul className="mt-6 space-y-3">
        {(messages ?? []).map((m) => (
          <li key={m.id} className="text-md">
            <span className="text-ink-2">{m.role}: </span>
            {m.content}
          </li>
        ))}
      </ul>
    </main>
  );
}
