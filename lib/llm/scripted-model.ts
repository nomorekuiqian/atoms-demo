import type { LanguageModelV3, LanguageModelV3CallOptions, LanguageModelV3StreamPart, LanguageModelV3Usage } from "@ai-sdk/provider";

export type ScriptAction = { tool: string; input: unknown } | { text: string };
export type ModelScript = (options: LanguageModelV3CallOptions, step: number) => ScriptAction | ScriptAction[] | Promise<ScriptAction | ScriptAction[]>;
const usage: LanguageModelV3Usage = { inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 0, text: 0, reasoning: 0 } };

/** Offline provider: only model responses are scripted. The real SDK executes all tools/loops. */
export function scriptedModel(script: ModelScript): LanguageModelV3 {
  let step = 0;
  return {
    specificationVersion: "v3", provider: "offline-fixture", modelId: "fixture", supportedUrls: {},
    doGenerate: async () => { throw new Error("Fixture model requires streaming."); },
    async doStream(options) {
      options.abortSignal?.throwIfAborted();
      const response = await script(options, step++);
      options.abortSignal?.throwIfAborted();
      const actions = Array.isArray(response) ? response : [response];
      return { stream: new ReadableStream<LanguageModelV3StreamPart>({ start(controller) {
        controller.enqueue({ type: "stream-start", warnings: [] });
        actions.forEach((action, index) => {
          const id = `${step}-${index}`;
          if ("tool" in action) controller.enqueue({ type: "tool-call", toolCallId: id, toolName: action.tool, input: JSON.stringify(action.input) });
          else {
            controller.enqueue({ type: "text-start", id });
            controller.enqueue({ type: "text-delta", id, delta: action.text });
            controller.enqueue({ type: "text-end", id });
          }
        });
        controller.enqueue({ type: "finish", finishReason: { unified: actions.some(a => "tool" in a) ? "tool-calls" : "stop", raw: undefined }, usage });
        controller.close();
      } }) };
    },
  };
}
