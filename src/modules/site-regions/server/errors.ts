import "server-only";

import { TRPCError } from "@trpc/server";

/**
 * Domain error codes raised by the Site region root/version server layer. Kept
 * as a typed code (not a string message) so the tRPC boundary can map them
 * without depending on message text.
 */
export type SiteRegionErrorCode = "NOT_FOUND" | "STALE_VERSION";

export class SiteRegionError extends Error {
  constructor(
    public readonly code: SiteRegionErrorCode,
    message: string,
  ) {
    super(message);
  }
}

interface MapSiteRegionErrorOptions {
  notFoundMessage?: string;
  staleMessage?: string;
  internalMessage?: string;
}

/**
 * Translate a Site region server error into the matching `TRPCError`. Any
 * unexpected error becomes an internal server error so the message text never
 * leaks.
 */
export function toSiteRegionTrpcError(
  error: unknown,
  {
    notFoundMessage = "Site region not found",
    staleMessage = "La versione del layout non è più quella corrente. Ricarica la pagina.",
    internalMessage = "Errore durante il salvataggio del layout.",
  }: MapSiteRegionErrorOptions = {},
): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof SiteRegionError) {
    if (error.code === "STALE_VERSION") {
      return new TRPCError({ code: "CONFLICT", message: staleMessage });
    }

    return new TRPCError({ code: "NOT_FOUND", message: notFoundMessage });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: internalMessage,
  });
}
