import { it, expect } from "vitest";
import { parseStepResult } from "./protocol";
it("rejects stale sessions, versions, action IDs and malformed responses", () => {
  const packet = {
    source: "atoms-acceptance",
    type: "step-result",
    sessionId: "s",
    versionId: "v",
    actionId: "a",
    status: "passed",
    detail: "ok",
  };
  expect(parseStepResult(packet, "s", "v", "a")).toEqual({
    status: "passed",
    detail: "ok",
  });
  for (const key of ["sessionId", "versionId", "actionId", "source", "status"])
    expect(
      parseStepResult({ ...packet, [key]: "stale" }, "s", "v", "a"),
    ).toBeNull();
  expect(
    parseStepResult({ ...packet, detail: "x".repeat(601) }, "s", "v", "a"),
  ).toBeNull();
  expect(parseStepResult(null, "s", "v", "a")).toBeNull();
});
