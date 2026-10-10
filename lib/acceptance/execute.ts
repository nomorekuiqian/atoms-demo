import type { AcceptanceStep, Criterion } from "./contract";
import type { ObservationInput } from "./evidence";
export type StepEvidence = NonNullable<
  ObservationInput["evidence"]["steps"]
>[number];
export type TestDriver = {
  load: () => Promise<void>;
  execute: (step: AcceptanceStep) => Promise<Omit<StepEvidence, "index">>;
  errors: () => string[];
};
/** Pure bounded orchestration; the driver owns the isolated browser session. */
export async function executeCriterion(
  item: Criterion,
  driver: TestDriver,
  signal: AbortSignal,
  onProgress: (index: number) => void = () => {},
) {
  const steps: StepEvidence[] = [];
  let status: ObservationInput["status"] = "passed";
  try {
    if (item.mode !== "automatic" || !item.steps.length)
      throw new Error("This criterion needs a manual check.");
    signal.throwIfAborted();
    await driver.load();
    for (const [index, step] of item.steps.entries()) {
      signal.throwIfAborted();
      onProgress(index);
      let result: Omit<StepEvidence, "index">;
      if (step.kind === "reload") {
        await driver.load();
        result = {
          status: "passed",
          detail: "Reloaded the isolated app with its test storage.",
        };
      } else result = await driver.execute(step);
      if (driver.errors().length)
        result = {
          status: "failed",
          detail: `Runtime error: ${driver.errors()[0]}`.slice(0, 600),
        };
      steps.push({ index, status: result.status, detail: result.detail });
      if (result.status !== "passed") {
        status = result.status;
        break;
      }
    }
  } catch (error) {
    status = "inconclusive";
    if (steps.length < item.steps.length)
      steps.push({
        index: steps.length,
        status: "inconclusive",
        detail: signal.aborted
          ? "Stopped before verification finished."
          : (error instanceof Error
              ? error.message
              : "Browser did not respond."
            ).slice(0, 600),
      });
  }
  return {
    status,
    evidence: {
      note:
        status === "passed"
          ? `All ${steps.length} declared steps were observed passing in an isolated browser session.`
          : (steps.at(-1)?.detail ?? "Not verified."),
      steps,
    },
  };
}
