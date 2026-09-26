import { describe, expect, it } from "vitest";

import { createInMemoryEffects } from "../effects";
import { defaultNodeRegistry } from "../node-registry";

describe("wait node handler", () => {
  it("interprets object duration fields as milliseconds", () => {
    const handler = defaultNodeRegistry.wait;
    const now = new Date("2026-01-01T00:00:00.000Z");
    const effects = createInMemoryEffects();

    const result = handler({
      node: {
        id: "wait",
        type: "wait",
        data: { duration: { seconds: 30, minutes: 1 } },
        position: { x: 0, y: 0 },
      },
      input: null,
      payload: null,
      run: { id: "run-1", triggerType: "manual" },
      step: { id: "step-1", attempts: 0 },
      now,
      effects,
    });

    expect(result).toEqual({
      output: null,
      resumeAt: new Date(now.getTime() + 30_000 + 60_000),
    });
  });
});
