import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decryptCredentialSecret,
  encryptCredentialSecret,
  getCredentialEncryptionKey,
} from "../../credentials/lib/credential-store";

describe("credential store", () => {
  const originalKey = process.env.AUTOMATION_CREDENTIALS_KEY;

  beforeEach(() => {
    process.env.AUTOMATION_CREDENTIALS_KEY = "0123456789abcdef0123456789abcdef";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.AUTOMATION_CREDENTIALS_KEY;
    } else {
      process.env.AUTOMATION_CREDENTIALS_KEY = originalKey;
    }
  });

  it("encrypts and decrypts a credential secret without revealing plaintext", () => {
    const secret = "super-secret-token";

    const encrypted = encryptCredentialSecret(secret);

    expect(encrypted).not.toBe(secret);
    expect(encrypted).toMatch(/^enc:v1:/);
    expect(decryptCredentialSecret(encrypted)).toBe(secret);
  });

  it("throws loudly when the encryption key is missing in development", () => {
    delete process.env.AUTOMATION_CREDENTIALS_KEY;

    expect(() => getCredentialEncryptionKey()).toThrow(
      /AUTOMATION_CREDENTIALS_KEY/i,
    );
  });
});
