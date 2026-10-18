import "server-only";

import { decryptSecret, encryptSecret } from "@/shared/lib/secrets-encryption";

import type { IntegrationSecretsUpdate } from "./types";

/**
 * Encrypt a provider secrets object for storage on an Integration row.
 * Undefined values are omitted so the stored JSON only contains configured
 * secrets.
 */
export function encryptIntegrationSecrets(
  secrets: Record<string, string | undefined>,
): string {
  const defined: Record<string, string> = {};
  for (const [key, value] of Object.entries(secrets)) {
    if (value !== undefined) {
      defined[key] = value;
    }
  }
  return encryptSecret(JSON.stringify(defined), "primary");
}

/**
 * Decrypt the secrets object stored on an Integration row.
 *
 * Throws explicitly for malformed ciphertext; it never returns the raw
 * ciphertext as plaintext.
 */
export function decryptIntegrationSecrets(encrypted: string): Record<string, string> {
  const decrypted = decryptSecret(encrypted);
  return JSON.parse(decrypted) as Record<string, string>;
}

/**
 * Apply an update payload to the current secrets object with explicit
 * semantics:
 * - absent or blank field → keep current value
 * - null → remove the secret
 * - non-empty string → replace the secret
 */
export function applySecretsUpdate<T extends Record<string, string | undefined>>(
  current: T,
  update: IntegrationSecretsUpdate<T>,
): T {
  const result = { ...current } as Record<string, string | undefined>;

  for (const [key, value] of Object.entries(update)) {
    if (value === undefined || value === "") {
      continue;
    }
    if (value === null) {
      delete result[key];
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
