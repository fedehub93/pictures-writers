import "server-only";

export const SCHEDULER_BATCH_SIZE = 50;

/**
 * Lease duration in milliseconds. A worker must complete the action or
 * refresh the lease within this window; otherwise another worker can reclaim
 * the action.
 */
export const SCHEDULER_LEASE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum number of execution attempts before an action is marked FAILED.
 */
export const SCHEDULER_MAX_ATTEMPTS = 3;

/**
 * Backoff delay in milliseconds between retries.
 */
export const SCHEDULER_RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

export const SCHEDULER_ACTION_TYPES = {
  PUBLISH_POST: "PUBLISH_POST",
  SEND_EMAIL: "SEND_EMAIL",
} as const;

export type SchedulerActionType =
  (typeof SCHEDULER_ACTION_TYPES)[keyof typeof SCHEDULER_ACTION_TYPES];

export const SCHEDULER_TARGET_TYPES = {
  POST_ROOT: "POST_ROOT",
  EMAIL_SINGLE_SEND: "EMAIL_SINGLE_SEND",
} as const;

export type SchedulerTargetType =
  (typeof SCHEDULER_TARGET_TYPES)[keyof typeof SCHEDULER_TARGET_TYPES];

export const SCHEDULER_STATUSES = {
  SCHEDULED: "SCHEDULED",
  PROCESSING: "PROCESSING",
  RETRY_WAIT: "RETRY_WAIT",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  CANCELED: "CANCELED",
} as const;

export type SchedulerStatus =
  (typeof SCHEDULER_STATUSES)[keyof typeof SCHEDULER_STATUSES];

/**
 * Error thrown by scheduler handlers to communicate the outcome of an
 * execution attempt.
 */
export class ScheduledActionHandlerError extends Error {
  constructor(
    message: string,
    public readonly transient: boolean,
  ) {
    super(message);
  }
}
