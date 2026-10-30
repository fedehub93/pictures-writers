/**
 * The canonical address of a Contact, which is the Contact identity.
 *
 * Only trims and lowercases: `+tags`, dots in the local part, Unicode and
 * punycode are left untouched, and the format is not validated — that stays
 * with Zod at the boundaries. This is identity, not validation.
 *
 * Returns `null` for an empty or whitespace-only address so callers can decide
 * whether the address is required. Callers holding `string | null` (an optional
 * form field, a webhook payload) must guard before calling: `null` is the
 * agreed "no address" signal, and a non-string input is a programming error.
 */
export const normalizeEmail = (raw: string): string | null => {
  const normalized = raw.trim().toLowerCase();

  return normalized === "" ? null : normalized;
};
