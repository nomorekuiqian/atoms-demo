import {it,expect} from "vitest";
import {isRunConflict} from "./conflict";
it("recognizes only fixed conflict messages or SQL conflict codes",()=>{
 expect(isRunConflict({message:"The project changed. Reload before building."})).toBe(true);
 expect(isRunConflict({code:"40001",message:"serialization"})).toBe(true);
 expect(isRunConflict({message:"timeout of 10000ms exceeded"})).toBe(false);
});
