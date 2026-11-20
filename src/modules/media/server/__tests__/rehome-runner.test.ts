import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { planRehome } from "@/modules/media/lib/rehome";

import { RehomeConfirmationRequiredError, RehomeDiskSpaceError, type RehomeReport } from "../rehome";
import {
  createRehomeRunner,
  RehomeAlreadyRunningError,
  type RehomeRunnerDependencies,
} from "../rehome-runner";
import { createLocalStorageDriver } from "../storage/local";
import type { ResolvedStorageDriver } from "../storage";

async function waitFor(predicate: () => boolean, timeout = 2000): Promise<void> {
  const started = Date.now();

  while (!predicate()) {
    if (Date.now() - started > timeout) {
      throw new Error("The runner did not reach the expected state in time.");
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

function report(overrides: Partial<RehomeReport> = {}): RehomeReport {
  return {
    target: "local",
    moved: 0,
    failed: [],
    bytesMoved: 0,
    abandoned: 0,
    superseded: false,
    stopped: false,
    ...overrides,
  };
}

describe("rehome runner", () => {
  let root: string;
  let target: ResolvedStorageDriver;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-rehome-runner-"));
    target = { name: "local", driver: createLocalStorageDriver({ root }) };
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const okPlan = planRehome({
    target: "local",
    files: 2,
    bytes: 100,
    availableBytes: null,
  });

  function runnerWith(
    dependencies: Partial<RehomeRunnerDependencies> = {},
  ) {
    return createRehomeRunner({
      resolveTarget: async () => target,
      plan: async () => okPlan,
      ...dependencies,
    });
  }

  it("starts detached, reports progress and finishes with the report", async () => {
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    const runner = runnerWith({
      run: async (options) => {
        options.onProgress?.({ fileId: "a", status: "moved", bytes: 10 });
        options.onProgress?.({
          fileId: "b",
          status: "failed",
          reason: "unreadable",
          bytes: 0,
        });

        await released;

        return report({
          moved: 1,
          failed: [{ fileId: "b", reason: "unreadable" }],
          bytesMoved: 10,
          abandoned: 1,
        });
      },
    });

    const started = await runner.start();

    expect(started).toMatchObject({ status: "running", target: "local", total: 2 });
    expect(runner.getState()).toMatchObject({
      processed: 2,
      moved: 1,
      failed: 1,
      failures: [{ fileId: "b", reason: "unreadable" }],
      bytesMoved: 10,
    });

    await expect(runner.start()).rejects.toBeInstanceOf(
      RehomeAlreadyRunningError,
    );

    release();
    await waitFor(() => runner.getState().status === "done");

    expect(runner.getState()).toMatchObject({
      status: "done",
      total: 2,
      processed: 2,
      moved: 1,
      failed: 1,
      failures: [{ fileId: "b", reason: "unreadable" }],
      bytesMoved: 10,
      abandoned: 1,
      superseded: false,
      stopped: false,
    });
  });

  it("stops at the next boundary and ends with the stopped report", async () => {
    const runner = runnerWith({
      run: async (options) => {
        await new Promise<void>((resolve) => {
          options.signal?.addEventListener("abort", () => resolve());
        });

        return report({ stopped: true });
      },
    });

    await runner.start();
    const stopping = runner.stop();

    expect(stopping.status).toBe("stopping");

    await waitFor(() => runner.getState().status === "done");

    expect(runner.getState()).toMatchObject({ status: "done", stopped: true });
  });

  it("needs confirmation for a warning plan and starts with it", async () => {
    const warning = planRehome({
      target: "local",
      files: 1,
      bytes: 1000,
      availableBytes: 1050,
    });

    let runs = 0;
    const runner = runnerWith({
      plan: async () => warning,
      run: async () => {
        runs += 1;
        return report({ moved: 1 });
      },
    });

    await expect(runner.start()).rejects.toBeInstanceOf(
      RehomeConfirmationRequiredError,
    );
    expect(runs).toBe(0);
    expect(runner.getState().status).toBe("idle");

    await runner.start({ confirmed: true });
    await waitFor(() => runner.getState().status === "done");

    expect(runs).toBe(1);
    expect(runner.getState().moved).toBe(1);
  });

  it("refuses a run the preflight refuses of its own accord", async () => {
    const runner = runnerWith({
      plan: async () =>
        planRehome({
          target: "local",
          files: 1,
          bytes: 1000,
          availableBytes: 10,
        }),
    });

    await expect(runner.start()).rejects.toBeInstanceOf(RehomeDiskSpaceError);
    expect(runner.getState().status).toBe("idle");
  });

  it("ends in failure with the message when the job throws", async () => {
    const runner = runnerWith({
      run: async () => {
        throw new Error("storage disappeared");
      },
    });

    await runner.start();
    await waitFor(() => runner.getState().status === "failed");

    expect(runner.getState()).toMatchObject({
      status: "failed",
      error: "storage disappeared",
    });
  });
});
