import { describe, expect, it } from "vitest";
import { titleFromPrompt } from "./title";

describe("titleFromPrompt", () => {
  it("drops the leading verb and capitalises", () => {
    expect(titleFromPrompt("build a pomodoro timer with stats")).toBe("Pomodoro timer with stats");
  });
  it("truncates long prompts", () => {
    expect(titleFromPrompt("x".repeat(60))).toBe(`X${"x".repeat(39)}…`);
  });
});
