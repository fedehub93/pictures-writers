import "server-only";

import { TRPCError } from "@trpc/server";

/**
 * Domain error codes raised by the Page root/version server layer. Kept as a
 * typed code (not a string message) so the tRPC boundary can map them without
 * depending on message text.
 */
export type PageErrorCode = "NOT_FOUND" | "MISSING_FIELDS";

export class PageError extends Error {
  constructor(
    public readonly code: PageErrorCode,
    message: string,
  ) {
    super(message);
  }
}

interface MapPageErrorOptions {
  notFoundMessage?: string;
  internalMessage?: string;
}

/**
 * Translate a Page server error into the matching `TRPCError`. Any unexpected
 * error becomes an internal server error so the message text never leaks.
 */
export function toPageTrpcError(
  error: unknown,
  {
    notFoundMessage = "Page not found",
    internalMessage = "Errore durante il salvataggio della pagina.",
  }: MapPageErrorOptions = {},
): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof PageError) {
    if (error.code === "NOT_FOUND") {
      return new TRPCError({ code: "NOT_FOUND", message: notFoundMessage });
    }

    return new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing required fields",
    });
  }

  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: internalMessage });
}
