import { describe, expect, it } from "vitest";
import { THEMES, withTheme } from "./themes";

describe("withTheme", () => {
  it("appends the preset as a plain constraint", () => {
    expect(withTheme("Build a timer ", "midnight")).toBe(`Build a timer\n\nTheme (Midnight): ${THEMES[1].brief}.`);
  });
  it("leaves the prompt alone without a theme", () => {
    expect(withTheme("Build a timer", null)).toBe("Build a timer");
  });
});
