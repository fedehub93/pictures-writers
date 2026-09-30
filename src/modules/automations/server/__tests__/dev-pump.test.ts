import { afterEach, describe, expect, it, vi } from "vitest";

import {
  startAutomationDevPump,
  stopAutomationDevPump,
} from "../dev-pump";

describe("automation dev pump", () => {
  afterEach(() => {
    stopAutomationDevPump();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("runs once immediately and then on the interval", async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockResolvedValue(undefined);

    const timer = startAutomationDevPump({ run, intervalMs: 1000 });

    expect(timer).not.toBeNull();
    expect(run).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);

    expect(run).toHaveBeenCalledTimes(4);
  });

  it("does not start twice and can be stopped", () => {
    const run = vi.fn().mockResolvedValue(undefined);

    expect(startAutomationDevPump({ run, intervalMs: 1000 })).not.toBeNull();
    expect(startAutomationDevPump({ run, intervalMs: 1000 })).toBeNull();

    stopAutomationDevPump();
    expect(startAutomationDevPump({ run, intervalMs: 1000 })).not.toBeNull();
  });

  it("logs a failed tick and keeps ticking", async () => {
    vi.useFakeTimers();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error("database down"));

    startAutomationDevPump({ run, intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[automations:dev-pump]",
      expect.any(Error),
    );
    expect(run.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
