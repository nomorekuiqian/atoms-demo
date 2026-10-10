import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("toolchain", () => {
  it("runs vitest with zod available", () => {
    expect(z.string().safeParse("ok").success).toBe(true);
  });
});
