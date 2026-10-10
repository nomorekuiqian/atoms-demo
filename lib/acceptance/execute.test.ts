import { it, expect } from "vitest";
import { executeCriterion, type TestDriver } from "./execute";
import type { Criterion } from "./contract";
const item: Criterion = {
  id: "add",
  requirement: "Add increases",
  procedure: "Click",
  expected: "1",
  mode: "automatic",
  steps: [
    { kind: "click", selector: "#add" },
    { kind: "expectText", selector: "#count", text: "1", match: "equals" },
  ],
};
it("fails a visible but inert button rather than accepting that the click dispatched", async () => {
  const driver: TestDriver = {
    load: async () => {},
    execute: async (step) =>
      step.kind === "click"
        ? { status: "passed", detail: "Clicked" }
        : { status: "failed", detail: "Observed 0, expected 1" },
    errors: () => [],
  };
  const result = await executeCriterion(
    item,
    driver,
    new AbortController().signal,
  );
  expect(result.status).toBe("failed");
  expect(result.evidence.steps).toHaveLength(2);
});
it("a lost browser response is inconclusive, not passed; runtime errors fail", async () => {
  const timeout: TestDriver = {
    load: async () => {
      throw new Error("No startup");
    },
    execute: async () => ({ status: "passed", detail: "ok" }),
    errors: () => [],
  };
  expect(
    (await executeCriterion(item, timeout, new AbortController().signal))
      .status,
  ).toBe("inconclusive");
  expect(
    (
      await executeCriterion(
        item,
        { ...timeout, load: async () => {}, errors: () => ["boom"] },
        new AbortController().signal,
      )
    ).status,
  ).toBe("failed");
});
it("reload uses the driver storage session; cancellation never passes", async () => {
  let loads = 0;
  const driver: TestDriver = {
    load: async () => {
      loads++;
    },
    execute: async () => ({ status: "passed", detail: "ok" }),
    errors: () => [],
  };
  const result = await executeCriterion(
    { ...item, steps: [{ kind: "reload" }, item.steps[1]] },
    driver,
    new AbortController().signal,
  );
  expect(loads).toBe(2);
  expect(result.status).toBe("passed");
  const c = new AbortController();
  c.abort();
  expect((await executeCriterion(item, driver, c.signal)).status).toBe(
    "inconclusive",
  );
});
it("persists only step evidence, never transport envelope fields", async () => {
  const driver: TestDriver = {
    load: async () => {},
    execute: async () => ({
      status: "passed",
      detail: "ok",
      source: "atoms-acceptance",
      actionId: "transport-only",
    }),
    errors: () => [],
  };
  const result = await executeCriterion(
    item,
    driver,
    new AbortController().signal,
  );
  expect(Object.keys(result.evidence.steps[0]).sort()).toEqual([
    "detail",
    "index",
    "status",
  ]);
});
