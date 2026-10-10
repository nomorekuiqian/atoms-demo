import { parseRequirements } from "@/lib/acceptance/contract";
import { extractJson, parseMikeHeader } from "@/lib/agents/prompts";
import { FileStreamParser } from "@/lib/parser/fileStreamParser";
import type { Files } from "@/lib/agents/types";
import type { AgentModels } from "./models";
import type { Fixture } from "./mock";
import { scriptedModel, type ScriptAction } from "./scripted-model";

/** Legacy text fixtures are explicitly converted to deterministic tool scripts, not real model reasoning. */
export function createFixtureModels(fixture: Fixture, options: { hasApp: boolean; fix?: boolean }): AgentModels {
  const mike = parseMikeHeader(fixture.mike);
  const full = !options.hasApp || !options.fix && mike?.route !== "alex_only";
  let contract = parseRequirements(fixture.emma);
  if (!contract.items.length) contract = { items: ["behavior", "layout", "preservation"].map(id => ({
    id: `fixture-${id}`, requirement: `Review ${id}`, procedure: "Manually compare the app with the request.",
    expected: "The request is satisfied.", mode: "manual" as const, steps: [],
  })), notice: "Legacy mock fixture: manual checklist synthesized for offline replay, not model-generated." };
  const rawPlan = extractJson(fixture.bob) as { files?: { path: string; purpose?: string }[]; notes?: string } | null;
  const plan = { files: (rawPlan?.files ?? [{ path: "index.html" }]).map(f => ({ ...f, purpose: f.purpose || "App file" })), notes: rawPlan?.notes || "Fixture plan" };
  const parser = new FileStreamParser(), files: Files = {}, closed = new Set<string>();
  let summary = "Updated the app", invalid = false;
  for (const event of [...parser.push(fixture.alex), ...parser.end()]) {
    if (event.type === "file_start") files[event.path] = "";
    if (event.type === "file_delta") files[event.path] += event.delta;
    if (event.type === "file_end") { closed.add(event.path); files[event.path] = files[event.path].replace(/^\n/, "").replace(/\n$/, ""); }
    if (event.type === "file_invalid") invalid = true;
    if (event.type === "summary") summary = event.text;
  }
  const t = (tool: string, input: unknown = {}): ScriptAction => ({ tool, input });
  return agent => {
    const actions: Record<string, ScriptAction[]> = {
      mike: [t("inspectProject"), ...(full ? [t("defineRequirements", { task: "Define acceptance criteria." }), t("planArchitecture", { task: "Plan implementation." })] : []), t("buildApp", { task: "Implement the request and check files." }), t("finishTask", { title: mike?.title ?? "App", brief: mike?.rest.trim() || "Updated the app." })],
      emma: [t("inspectProject"), t("validateRequirements", { contract }), t("submitRequirements", { contract })],
      bob: [t("inspectProject"), t("validatePlan", { plan }), t("submitPlan", { plan })],
      alex: invalid || closed.size !== Object.keys(files).length ? [{ text: "Incomplete fixture output." }] : [t("inspectProject"), ...Object.entries(files).map(([path, content]) => t("writeFile", { path, content })), t("checkApp"), t("finishBuild", { summary })],
    };
    return scriptedModel((_opts, step) => actions[agent][step] ?? { text: "Fixture script ended without validated completion." });
  };
}
