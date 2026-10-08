import "server-only";

import { TRPCError } from "@trpc/server";

/**
 * Domain error codes raised by the Post root/version server layer. Kept as a
 * typed code (not a string message) so the tRPC boundary can map them without
 * depending on message text.
 */
export type PostErrorCode = "NOT_FOUND" | "MISSING_FIELDS";

export class PostError extends Error {
  constructor(
    public readonly code: PostErrorCode,
    message: string,
  ) {
    super(message);
  }
}

interface MapPostErrorOptions {
  notFoundMessage?: string;
  internalMessage?: string;
}

/**
 * Translate a Post server error into the matching `TRPCError`. Any unexpected
 * error becomes an internal server error so the message text never leaks.
 */
export function toPostTrpcError(
  error: unknown,
  {
    notFoundMessage = "Post not found",
    internalMessage = "Error saving post.",
  }: MapPostErrorOptions = {},
): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof PostError) {
    if (error.code === "NOT_FOUND") {
      return new TRPCError({ code: "NOT_FOUND", message: notFoundMessage });
    }

    return new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing required fields",
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: internalMessage,
  });
}
