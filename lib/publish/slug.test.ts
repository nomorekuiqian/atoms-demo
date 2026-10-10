import { describe, expect, it } from "vitest";
import { slugProblem, suggestSlug } from "./slug";

describe("slugProblem", () => {
  it.each(["my-pomodoro", "abc123", "a".repeat(30), "snake-2026"])("accepts %s", (s) => expect(slugProblem(s)).toBeNull());
  it.each([
    ["abc", "at least 6"],
    ["a".repeat(31), "at most 30"],
    ["Hello-World", "lowercase"],
    ["-abcdef", "Start and end"],
    ["abcdef-", "Start and end"],
    ["my_app_1", "lowercase"],
    ["dashboard", "reserved"],
  ])("rejects %s", (s, msg) => expect(slugProblem(s)).toContain(msg));
});

describe("suggestSlug", () => {
  it("builds a valid slug from any title", () => {
    for (const t of ["Pomodoro Timer", "番茄钟", "!!!", "A very long project title that keeps going and going"]) {
      expect(slugProblem(suggestSlug(t))).toBeNull();
    }
    expect(suggestSlug("Pomodoro Timer", () => 0)).toBe("pomodoro-timer-0000");
  });
});
