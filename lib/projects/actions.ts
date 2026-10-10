"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { insforgeAdmin } from "@/lib/insforge/admin";
import { insforgeServer } from "@/lib/insforge/server";
import { titleFromPrompt } from "./title";

const promptSchema = z.string().trim().min(1, "Describe what you want to build.").max(4000);
const titleSchema = z.string().trim().min(1, "Give your project a name.").max(120);

export type ActionResult = { error?: string } | undefined;

export async function createProject(prompt: string): Promise<ActionResult> {
  const parsed = promptSchema.safeParse(prompt);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const client = await insforgeServer();
  const { data: auth } = await client.auth.getCurrentUser();
  if (!auth?.user) return { error: "Sign in to create a project." };

  // One transaction: a failed prompt write must not leave an empty project.
  const { data: projectId, error } = await insforgeAdmin().database.rpc("create_project_with_prompt", {
    p_user: auth.user.id,
    p_title: titleFromPrompt(parsed.data),
    p_prompt: parsed.data,
  });
  if (error || typeof projectId !== "string") return { error: "Couldn't create the project. Try again." };

  redirect(`/project/${projectId}?autostart=1`);
}

export async function renameProject(id: string, title: string): Promise<ActionResult> {
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await (await insforgeServer()).database.from("projects").update({ title: parsed.data }).eq("id", id);
  if (error) return { error: "Couldn't rename the project." };
  revalidatePath("/dashboard");
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { error } = await (await insforgeServer()).database.from("projects").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the project." };
  revalidatePath("/dashboard");
}
