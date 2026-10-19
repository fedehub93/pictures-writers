import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decryptSecret,
  encryptSecret,
  getEncryptionKey,
} from "../secrets-encryption";

describe("secrets encryption", () => {
  const originalPrimary = process.env.SECRETS_ENCRYPTION_KEY;
  const originalLegacy = process.env.AUTOMATION_CREDENTIALS_KEY;

  beforeEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";
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

  it("encrypts and decrypts a secret with the primary key", () => {
    const secret = "super-secret-token";

    const encrypted = encryptSecret(secret);

    expect(encrypted).not.toBe(secret);
    expect(encrypted).toMatch(/^enc:v1:primary:/);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("uses a random IV so identical secrets produce different ciphertexts", () => {
    const secret = "super-secret-token";

    const encrypted1 = encryptSecret(secret);
    const encrypted2 = encryptSecret(secret);

    expect(encrypted1).not.toBe(encrypted2);
    expect(decryptSecret(encrypted1)).toBe(secret);
    expect(decryptSecret(encrypted2)).toBe(secret);
  });

  it("selects the key by keyId", () => {
    process.env.AUTOMATION_CREDENTIALS_KEY = "legacy-key-0123456789abcdef";
    const secret = "legacy-secret";

    const encrypted = encryptSecret(secret, "legacy");

    expect(encrypted).toMatch(/^enc:v1:legacy:/);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("decrypts legacy rows when only the legacy key is set", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    process.env.AUTOMATION_CREDENTIALS_KEY = "legacy-key-0123456789abcdef";
    const secret = "legacy-secret";

    const encrypted = encryptSecret(secret, "legacy");

    expect(encrypted).toMatch(/^enc:v1:legacy:/);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("uses the primary key for a primary row even when both keys are set", () => {
    process.env.AUTOMATION_CREDENTIALS_KEY = "legacy-key-0123456789abcdef";
    const secret = "primary-secret";

    const encrypted = encryptSecret(secret, "primary");
    const withDifferentPrimary = "different-primary-0123456789abcdef";
    process.env.SECRETS_ENCRYPTION_KEY = withDifferentPrimary;

    // Changing the primary key after encryption must break decryption.
    expect(() => decryptSecret(encrypted)).toThrow();
  });

  it("fails loudly when the requested key is missing and names the env var", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;

    expect(() => getEncryptionKey("primary")).toThrow(/SECRETS_ENCRYPTION_KEY/i);
  });

  it("fails loudly when the legacy key is missing and names the env var", () => {
    delete process.env.AUTOMATION_CREDENTIALS_KEY;

    expect(() => getEncryptionKey("legacy")).toThrow(
      /AUTOMATION_CREDENTIALS_KEY/i,
    );
  });

  it("fails explicitly when the ciphertext has no version prefix", () => {
    expect(() => decryptSecret("plain-text")).toThrow(/prefix/i);
  });

  it("fails explicitly when the ciphertext is missing the keyId", () => {
    expect(() => decryptSecret("enc:v1:nokeyidsegment")).toThrow(/keyId/i);
  });

  it("fails explicitly for an unknown keyId", () => {
    expect(() => decryptSecret("enc:v1:unknown:ab")).toThrow(/unknown|keyId/i);
  });

  it("fails explicitly when the payload is too short", () => {
    expect(() => decryptSecret("enc:v1:primary:ab")).toThrow(/payload|short/i);
  });

  it("fails explicitly when the auth tag is corrupted", () => {
    const encrypted = encryptSecret("super-secret-token");
    const tampered = encrypted.slice(0, -4) + "0000";

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("fails explicitly when decrypting a row encrypted with a different key", () => {
    const secret = "super-secret-token";
    const encrypted = encryptSecret(secret, "primary");
    delete process.env.SECRETS_ENCRYPTION_KEY;
    process.env.AUTOMATION_CREDENTIALS_KEY = "different-legacy-key-0123456";

    expect(() => decryptSecret(encrypted)).toThrow();
  });
});
