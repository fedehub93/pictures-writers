import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const CREDENTIALS_KEY_ENV = "AUTOMATION_CREDENTIALS_KEY";
const ENCRYPTION_PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function getCredentialEncryptionKey(): string {
  const key = process.env[CREDENTIALS_KEY_ENV];

  if (!key) {
    throw new Error(
      `Missing ${CREDENTIALS_KEY_ENV} environment variable. Set it before using automation credentials.`,
    );
  }

  return createHash("sha256").update(key).digest("hex");
}

export function encryptCredentialSecret(secret: string): string {
  const key = getCredentialEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${ENCRYPTION_PREFIX}${payload}`;
}

export function decryptCredentialSecret(encrypted: string): string {
  if (!encrypted.startsWith(ENCRYPTION_PREFIX)) {
    return encrypted;
  }

  const payload = encrypted.slice(ENCRYPTION_PREFIX.length);
  const buffer = Buffer.from(payload, "base64");

  if (buffer.length < IV_LENGTH + TAG_LENGTH) {
    return encrypted;
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const value = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", getCredentialEncryptionKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(value),
    decipher.final(),
  ]).toString("utf8");
}
