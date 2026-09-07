/**
 * Shared helpers for the non-blocking "propagate*" functions.
 * They map provider/internal errors to a { propagationWarning } result so
 * callers can surface them in tRPC responses without failing the local
 * database operation.
 */

/** Map a provider error list to a propagation warning result. */
export function providerErrorWarning(errors: string[]): {
  propagationWarning: string;
} {
  return { propagationWarning: `Provider error: ${errors.join(", ")}` };
}

/** Log and map an unexpected error to a propagation warning result. */
export function unexpectedErrorWarning(
  label: string,
  error: unknown,
): { propagationWarning: string } {
  console.error(`[${label}] Unexpected error:`, error);
  return {
    propagationWarning:
      error instanceof Error ? error.message : "Unknown propagation error",
  };
}
