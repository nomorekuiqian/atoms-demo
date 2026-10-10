export type AgentId = "mike" | "emma" | "bob" | "alex";

export const AGENTS: Record<AgentId, { name: string; role: string }> = {
  mike: { name: "Mike", role: "Team Leader" },
  emma: { name: "Emma", role: "Product Manager" },
  bob: { name: "Bob", role: "Architect" },
  alex: { name: "Alex", role: "Engineer" },
};
