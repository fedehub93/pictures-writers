/**
 * The form a `form.submitted` trigger is scoped to, read from the trigger
 * node's configuration. Returns "" when unset.
 */
export function readConfiguredFormId(
  data: Record<string, unknown> | undefined,
): string {
  const value = data?.formId;
  return typeof value === "string" ? value.trim() : "";
}
