import "server-only";

import { TRPCError } from "@trpc/server";

import {
  MediaInUseError,
  MediaNotArchivedError,
  MediaNotFoundError,
  MediaProcessingError,
} from "./media-service";
import {
  RehomeConfirmationRequiredError,
  RehomeDiskSpaceError,
  RehomeTargetUnconfiguredError,
} from "./rehome";
import { RehomeAlreadyRunningError } from "./rehome-runner";

/**
 * Translate a media service error into the matching `TRPCError`, keeping the
 * service's message so the interface can still explain why an action was
 * refused (a Media is active, or a reference count blocks the deletion).
 */
export function toMediaTrpcError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof MediaNotFoundError) {
    return new TRPCError({ code: "NOT_FOUND", message: error.message });
  }

  if (
    error instanceof MediaNotArchivedError ||
    error instanceof MediaInUseError ||
    error instanceof RehomeAlreadyRunningError
  ) {
    return new TRPCError({ code: "CONFLICT", message: error.message });
  }

  if (
    error instanceof RehomeConfirmationRequiredError ||
    error instanceof RehomeDiskSpaceError ||
    error instanceof RehomeTargetUnconfiguredError
  ) {
    return new TRPCError({
      code: "PRECONDITION_FAILED",
      message: error.message,
    });
  }

  if (error instanceof MediaProcessingError) {
    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "The media operation failed.",
  });
}
