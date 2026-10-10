import type { AgentEvent } from "@/lib/agents/types";
import { readEvents } from "./readEvents";
/** A quiet socket EOF is not a successful protocol termination. */
export async function readRun(body: ReadableStream<Uint8Array>, apply: (event: AgentEvent) => void) {
  let done = false;
  for await (const event of readEvents<AgentEvent>(body)) {
    if (done) break;
    apply(event);
    done = event.type === "done";
  }
  if (!done) throw new Error("The connection dropped before the build finished. Try again.");
}
