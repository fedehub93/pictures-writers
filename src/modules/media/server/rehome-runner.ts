import "server-only";

import { revalidateContent } from "@/shared/lib/revalidate-content";
import type { RehomeFailure, RehomePlan } from "@/modules/media/lib/rehome";

import {
  assertRehomePlanAllows,
  planRehomeRun,
  rehomeStoredFiles,
  type RehomeProgress,
  type RehomeReport,
  type RehomeRunOptions,
} from "./rehome";
import {
  resolveActiveStorageDriver,
  type ResolvedStorageDriver,
  type StorageDriverName,
} from "./storage";

export class RehomeAlreadyRunningError extends Error {
  readonly code = "REHOME_ALREADY_RUNNING";

  constructor() {
    super("A move is already running. Wait for it to finish or stop it first.");
    this.name = "RehomeAlreadyRunningError";
  }
}

export type RehomeRunStatus =
  | "idle"
  | "running"
  | "stopping"
  | "done"
  | "failed";

export interface RehomeRunState {
  status: RehomeRunStatus;
  target: StorageDriverName | null;
  /** Files pending when the run started. */
  total: number;
  processed: number;
  moved: number;
  failed: number;
  /** Files left in place, by id and reason. */
  failures: RehomeFailure[];
  bytesMoved: number;
  /** Provider objects journaled for the purge. */
  abandoned: number;
  startedAt: string | null;
  finishedAt: string | null;
  /** The active driver changed, so the next run converges on the new one. */
  superseded: boolean;
  /** The owner stopped the run; the rest are left for the next one. */
  stopped: boolean;
  /** Why a run ended without a report. */
  error: string | null;
}

export interface RehomeRunner {
  getState(): RehomeRunState;
  start(options?: { confirmed?: boolean }): Promise<RehomeRunState>;
  stop(): RehomeRunState;
}

export interface RehomeRunnerDependencies {
  /** Resolves the target driver; defaults to the active choice. */
  resolveTarget: () => Promise<ResolvedStorageDriver>;
  /** Computes the preflight; defaults to the database and the volume. */
  plan: (target: ResolvedStorageDriver) => Promise<RehomePlan>;
  /** The job; defaults to `rehomeStoredFiles`. */
  run: (options: RehomeRunOptions) => Promise<RehomeReport>;
}

function idleState(): RehomeRunState {
  return {
    status: "idle",
    target: null,
    total: 0,
    processed: 0,
    moved: 0,
    failed: 0,
    failures: [],
    bytesMoved: 0,
    abandoned: 0,
    startedAt: null,
    finishedAt: null,
    superseded: false,
    stopped: false,
    error: null,
  };
}

function snapshot(state: RehomeRunState): RehomeRunState {
  return { ...state, failures: [...state.failures] };
}

/**
 * The in-memory state of the library's move.
 *
 * A move runs detached from the mutation that started it, because copying a
 * library takes longer than a request. The deployment is single-instance by
 * design, so this state is the run: progress polls it, stop aborts it, and a
 * restart simply loses it while leaving every file moved so far already
 * flipped. One run at a time is what makes "stop" and "supersede" meaningful.
 */
export function createRehomeRunner(
  dependencies: Partial<RehomeRunnerDependencies> = {},
): RehomeRunner {
  const deps: RehomeRunnerDependencies = {
    resolveTarget: dependencies.resolveTarget ?? (() => resolveActiveStorageDriver()),
    plan:
      dependencies.plan ??
      ((target) => planRehomeRun({ target })),
    run: dependencies.run ?? rehomeStoredFiles,
  };

  let state = idleState();
  let controller: AbortController | null = null;

  const recordProgress = (progress: RehomeProgress) => {
    if (progress.status === "moved") {
      state = {
        ...state,
        processed: state.processed + 1,
        moved: state.moved + 1,
        bytesMoved: state.bytesMoved + progress.bytes,
      };
      return;
    }

    state = {
      ...state,
      processed: state.processed + 1,
      failed: state.failed + 1,
      failures: [
        ...state.failures,
        { fileId: progress.fileId, reason: progress.reason ?? "copy-failed" },
      ],
    };
  };

  const finish = (report: RehomeReport) => {
    state = {
      ...state,
      status: "done",
      processed: report.moved + report.failed.length,
      moved: report.moved,
      failed: report.failed.length,
      failures: [...report.failed],
      bytesMoved: report.bytesMoved,
      abandoned: report.abandoned,
      superseded: report.superseded,
      stopped: report.stopped,
      finishedAt: new Date().toISOString(),
    };

    if (report.moved === 0) return;

    // Pages embed the Media's `?mt=` token, and a moved rendition's address
    // inside it changed even though the original's did not. Drop the cached
    // output once per run; the next build would otherwise keep pointing at
    // the provider object the purge is allowed to remove.
    try {
      revalidateContent("all");
    } catch (error) {
      console.error(
        "[MEDIA_REHOME] could not revalidate the published pages",
        error,
      );
    }
  };

  const fail = (error: unknown) => {
    console.error("[MEDIA_REHOME] the move failed", error);
    state = {
      ...state,
      status: "failed",
      error:
        error instanceof Error ? error.message : "The move could not finish.",
      finishedAt: new Date().toISOString(),
    };
  };

  return {
    getState: () => snapshot(state),

    async start({ confirmed = false } = {}) {
      if (state.status === "running" || state.status === "stopping") {
        throw new RehomeAlreadyRunningError();
      }

      const target = await deps.resolveTarget();
      const plan = await deps.plan(target);
      assertRehomePlanAllows(plan, confirmed);

      const runController = new AbortController();
      controller = runController;

      state = {
        ...idleState(),
        status: "running",
        target: target.name,
        total: plan.files,
        startedAt: new Date().toISOString(),
      };

      // Detached on purpose: the request that starts a move returns at once,
      // and the library follows the progress by polling. The catch is what
      // keeps a storage failure from becoming an unhandled rejection.
      void deps
        .run({
          target,
          plan,
          confirmed,
          signal: runController.signal,
          onProgress: recordProgress,
        })
        .then(finish)
        .catch(fail)
        .finally(() => {
          controller = null;
        });

      return snapshot(state);
    },

    stop() {
      if (state.status !== "running") return snapshot(state);

      state = { ...state, status: "stopping" };
      controller?.abort();

      return snapshot(state);
    },
  };
}

/** The Installation's one move. Procedures read its state and drive it. */
export const rehomeRunner = createRehomeRunner();
