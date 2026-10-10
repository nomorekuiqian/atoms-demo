import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { AgentId } from "@/lib/agents/meta";

/** Each invocation gets a model; the SDK owns its private conversation/tool loop. */
export type AgentModels = (agent: AgentId, modelId: string) => LanguageModel;

export function createGatewayModels(options: { baseURL: string; apiKey: string }): AgentModels {
  const provider = createOpenAICompatible({
    name: "insforge",
    ...options,
    includeUsage: true,
    // State-changing tools must not race, even if a model proposes a batch.
    transformRequestBody: body => ({ ...body, parallel_tool_calls: false }),
  });
  return (_agent, modelId) => provider.chatModel(modelId);
}
