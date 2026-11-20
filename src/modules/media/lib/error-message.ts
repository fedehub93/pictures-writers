/**
 * The readable message a failed media action should show. tRPC keeps the
 * service message on its client errors, so a refused deletion still explains
 * why it was refused.
 */
export function mediaErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
