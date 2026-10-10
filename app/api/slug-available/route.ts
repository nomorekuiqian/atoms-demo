import { insforgeAdmin } from "@/lib/insforge/admin";
import { getCurrentUser } from "@/lib/insforge/server";
import { slugProblem } from "@/lib/publish/slug";

export const dynamic = "force-dynamic";

/** GET ?slug=&projectId= → { available, problem? }. A project's own current slug counts as available. */
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Sign in first." }, { status: 401 });
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  const projectId = url.searchParams.get("projectId");
  const problem = slugProblem(slug);
  if (problem) return Response.json({ available: false, problem });
  const { data, error } = await insforgeAdmin().database.from("projects").select("id").eq("published_slug", slug).maybeSingle();
  if (error) return Response.json({ error: "Could not check this link. Please retry." }, { status: 503 });
  const available = !data || data.id === projectId;
  return Response.json({ available, problem: available ? undefined : "That link is taken. Try another." });
}
