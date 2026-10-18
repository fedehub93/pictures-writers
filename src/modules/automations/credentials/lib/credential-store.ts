import "server-only";

import {
  decryptSecret,
  encryptSecret,
  ENCRYPTION_PREFIX,
  getEncryptionKey,
} from "@/shared/lib/secrets-encryption";

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Returns the legacy automation credentials encryption key.
 *
 * Kept for backwards compatibility with existing imports; new credential
 * secrets are encrypted with the primary `SECRETS_ENCRYPTION_KEY`.
 */
export function getCredentialEncryptionKey(): Buffer {
  return getEncryptionKey("legacy");
}

export function encryptCredentialSecret(secret: string): string {
  return encryptSecret(secret, "primary");
}

export function decryptCredentialSecret(encrypted: string): string {
  if (!encrypted.startsWith(ENCRYPTION_PREFIX)) {
    return encrypted;
  }

  const withoutPrefix = encrypted.slice(ENCRYPTION_PREFIX.length);
  const keyIdSeparator = withoutPrefix.indexOf(":");

  if (keyIdSeparator === -1) {
    // Old-format rows produced before the shared keyId format.
    // Preserve the legacy fallback for too-short payloads.
    const buffer = Buffer.from(withoutPrefix, "base64");
    if (buffer.length < IV_LENGTH + TAG_LENGTH) {
      return encrypted;
    }

    return decryptSecret(`${ENCRYPTION_PREFIX}legacy:${withoutPrefix}`);
  }

  return decryptSecret(encrypted);
}
