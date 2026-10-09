import "server-only";

import { TRPCError } from "@trpc/server";

/**
 * Domain error codes raised by the Product root/version server layer. Kept as a
 * typed code (not a string message) so the tRPC boundary can map them without
 * depending on message text.
 */
export type ProductErrorCode =
  | "NOT_FOUND"
  | "MISSING_FIELDS"
  | "METADATA_MISMATCH";

export class ProductError extends Error {
  constructor(
    public readonly code: ProductErrorCode,
    message: string,
  ) {
    super(message);
  }
}

interface MapProductErrorOptions {
  notFoundMessage?: string;
  internalMessage?: string;
  metadataMessage?: string;
}

/**
 * Translate a Product server error into the matching `TRPCError`. Any
 * unexpected error becomes an internal server error so the message text never
 * leaks.
 */
export function toProductTrpcError(
  error: unknown,
  {
    notFoundMessage = "Il prodotto richiesto non esiste.",
    internalMessage = "Errore durante il salvataggio del prodotto.",
    metadataMessage = "I metadati non corrispondono al tipo di prodotto.",
  }: MapProductErrorOptions = {},
): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof ProductError) {
    if (error.code === "NOT_FOUND") {
      return new TRPCError({ code: "NOT_FOUND", message: notFoundMessage });
    }

    if (error.code === "METADATA_MISMATCH") {
      return new TRPCError({ code: "BAD_REQUEST", message: metadataMessage });
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
