import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  encryptSecret,
  ENCRYPTION_PREFIX,
} from "@/shared/lib/secrets-encryption";

import {
  decryptCredentialSecret,
  encryptCredentialSecret,
  getCredentialEncryptionKey,
} from "../../credentials/lib/credential-store";

describe("credential store", () => {
  const originalPrimary = process.env.SECRETS_ENCRYPTION_KEY;
  const originalLegacy = process.env.AUTOMATION_CREDENTIALS_KEY;

  beforeEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = "primary-key-0123456789abcdef";
    delete process.env.AUTOMATION_CREDENTIALS_KEY;
  });

  afterEach(() => {
    if (originalPrimary === undefined) {
      delete process.env.SECRETS_ENCRYPTION_KEY;
    } else {
      process.env.SECRETS_ENCRYPTION_KEY = originalPrimary;
    }

    if (originalLegacy === undefined) {
      delete process.env.AUTOMATION_CREDENTIALS_KEY;
    } else {
      process.env.AUTOMATION_CREDENTIALS_KEY = originalLegacy;
    }
  });

  it("encrypts and decrypts a credential secret with the primary key", () => {
    const secret = "super-secret-token";

    const encrypted = encryptCredentialSecret(secret);

    expect(encrypted).not.toBe(secret);
    expect(encrypted).toMatch(/^enc:v1:primary:/);
    expect(decryptCredentialSecret(encrypted)).toBe(secret);
  });

  it("decrypts legacy rows encrypted with the old key when only it is set", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    process.env.AUTOMATION_CREDENTIALS_KEY = "legacy-key-0123456789abcdef";
    const secret = "legacy-secret";

    const encrypted = encryptSecret(secret, "legacy");

    expect(encrypted).toMatch(/^enc:v1:legacy:/);
    expect(decryptCredentialSecret(encrypted)).toBe(secret);
  });

  it("decrypts old-format credential rows without a keyId", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    process.env.AUTOMATION_CREDENTIALS_KEY = "legacy-key-0123456789abcdef";
    const secret = "legacy-secret";
    const withKeyId = encryptSecret(secret, "legacy");
    // Strip the keyId to simulate rows produced by the previous implementation.
    const encrypted = withKeyId.replace(/^enc:v1:legacy:/, ENCRYPTION_PREFIX);

    expect(encrypted).toMatch(/^enc:v1:[^:]+$/);
    expect(decryptCredentialSecret(encrypted)).toBe(secret);
  });

  it("passes through plaintext credential values", () => {
    expect(decryptCredentialSecret("plain-text")).toBe("plain-text");
  });

  it("passes through too-short credential ciphertexts", () => {
    const encrypted = `${ENCRYPTION_PREFIX}ab`;

    expect(decryptCredentialSecret(encrypted)).toBe(encrypted);
  });

  it("throws loudly when the encryption key is missing in development", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;

    expect(() => encryptCredentialSecret("secret")).toThrow(
      /SECRETS_ENCRYPTION_KEY/i,
    );
  });

  it("keeps getCredentialEncryptionKey reading the legacy env var", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    process.env.AUTOMATION_CREDENTIALS_KEY = "legacy-key-0123456789abcdef";

    expect(getCredentialEncryptionKey().toString("hex")).toHaveLength(64);
  });

  it("throws with the legacy env var name when the legacy key is missing", () => {
    delete process.env.AUTOMATION_CREDENTIALS_KEY;

    expect(() => getCredentialEncryptionKey()).toThrow(
      /AUTOMATION_CREDENTIALS_KEY/i,
    );
  });

  it("throws when a new-format credential ciphertext has a corrupted tag", () => {
    const encrypted = encryptCredentialSecret("super-secret-token");
    const tampered = encrypted.slice(0, -4) + "0000";

    expect(() => decryptCredentialSecret(tampered)).toThrow();
  });
});
