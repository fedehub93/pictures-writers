import "server-only";

import { StorageObjectNotFoundError } from "./storage";

/** Stable, operator-readable reason for a source a backfill could not process. */
export function describeBackfillFailure(error: unknown): string {
  if (error instanceof StorageObjectNotFoundError) {
    return "source not found in storage";
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
