import { describe, it, expect, vi } from "vitest";
import { loadProjectState, loadHistory, generationsToday, persistRun } from "./persist";
import type { PipelineResult } from "./types";
const failed = { data: null, error: { message: "offline" } };
function db(results: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select","eq","gte","order"]) chain[method] = () => chain;
  for (const method of ["maybeSingle","limit"]) chain[method] = () => Promise.resolve(results.shift());
  return {from: () => chain};
}
describe("read failures never become empty projects", () => {
  it("distinguishes missing from failed project", async () => {
    expect(await loadProjectState(db([{data:null,error:null}]),"p")).toBeNull();
    await expect(loadProjectState(db([failed]),"p")).rejects.toThrow("read failed");
  });
  it("fails closed for the current snapshot", async () => {
    await expect(loadProjectState(db([{data:{id:"p",current_version_id:"v"}},failed]),"p")).rejects.toThrow("could not be read");
  });
  it("fails closed for history and quota", async () => {
    await expect(loadHistory(db([failed]),"p")).rejects.toThrow("History");
    await expect(generationsToday(db([failed]))).rejects.toThrow("Usage");
  });
});
it("saves the entire run in one transaction, propagating failure", async () => {
  const rpc = vi.fn().mockResolvedValue(failed);
  const result: PipelineResult = {route:"alex_only", agents:[], written:{},summary:"x",ok:true,usage:[]};
  await expect(persistRun({rpc},{requestId:"r",lease:"l",userId:"u",merged:{"index.html":"ok"},result,mock:true,prompt:"change"})).rejects.toThrow("offline");
  expect(rpc).toHaveBeenCalledOnce();
  expect(rpc.mock.calls[0][1].p_messages[0].content).toBe("change");
});
