import { z } from "zod";
const resultSchema = z.object({
  source: z.literal("atoms-acceptance"),
  type: z.literal("step-result"),
  sessionId: z.string().max(100),
  versionId: z.string().max(100),
  actionId: z.string().max(100),
  status: z.enum(["passed", "failed", "inconclusive"]),
  detail: z.string().max(600),
});
/** The caller must also verify event.source is its dedicated iframe window. */
export function parseStepResult(
  value: unknown,
  sessionId: string,
  versionId: string,
  actionId: string,
) {
  const parsed = resultSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.sessionId !== sessionId ||
    parsed.data.versionId !== versionId ||
    parsed.data.actionId !== actionId
  )
    return null;
  return { status: parsed.data.status, detail: parsed.data.detail };
}
