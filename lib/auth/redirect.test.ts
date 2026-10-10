import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("keeps internal paths", () => {
    expect(safeNext("/project/abc?autostart=1")).toBe("/project/abc?autostart=1");
  });
  it.each([undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "dashboard"])("rejects %s", (v) => {
    expect(safeNext(v)).toBe("/dashboard");
  });
});
