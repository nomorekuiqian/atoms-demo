import {it,expect,vi} from "vitest";
import {readRun} from "./readRun";
const body=(text:string)=>new Response(text).body!;
it("rejects silent and truncated EOF",async()=>{
  await expect(readRun(body('data: {"type":"agent_start","agent":"alex","activity":"Writing"}\n\n'),vi.fn())).rejects.toThrow("before the build finished");
  await expect(readRun(body('data: {"type":"done"'),vi.fn())).rejects.toThrow();
});
it("accepts done and ignores later contradictory events",async()=>{
  const apply=vi.fn();
  await readRun(body('data: {"type":"done"}\n\ndata: {"type":"error","message":"late"}\n\n'),apply);
  expect(apply).toHaveBeenCalledOnce();
});
