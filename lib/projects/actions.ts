"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { insforgeServer } from "@/lib/insforge/server";
import { titleFromPrompt } from "./title";

const promptSchema = z.string().trim().min(1, "Describe what you want to build.").max(4000);
const titleSchema = z.string().trim().min(1, "Give your project a name.").max(120);

export type ActionResult = { error?: string } | undefined;

export async function createProject(prompt: string): Promise<ActionResult> {
  const parsed = promptSchema.safeParse(prompt);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const db = (await insforgeServer()).database;

  const { data: project, error } = await db
    .from("projects")
    .insert([{ title: titleFromPrompt(parsed.data) }])
    .select("id")
    .single();
  if (error || !project) return { error: "Couldn't create the project. Try again." };

  const { error: msgError } = await db
    .from("messages")
    .insert([{ project_id: project.id, role: "user", content: parsed.data }]);
  if (msgError) return { error: "Couldn't save your prompt. Try again." };

  redirect(`/project/${project.id}?autostart=1`);
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
