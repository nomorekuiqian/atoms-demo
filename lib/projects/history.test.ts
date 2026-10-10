import { it, expect } from "vitest";
import { toUIMessage } from "./history";
it("restores tool traces without turning interrupted operations into success", () => {
  const message = toUIMessage({ id:"a", sequence:1, role:"alex", content:"", version:null, meta:{status:"failed",trace:[{id:"1",tool:"checkApp",step:2,status:"failed"},{id:"2",tool:"writeFile",step:3,status:"running"}]}});
  expect(message.steps).toHaveLength(2);
  expect(message.steps.every(s => s.kind === "tool" && s.status === "failed")).toBe(true);
});
