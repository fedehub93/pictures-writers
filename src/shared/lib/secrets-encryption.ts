import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export const PRIMARY_KEY_ENV = "SECRETS_ENCRYPTION_KEY";
export const LEGACY_KEY_ENV = "AUTOMATION_CREDENTIALS_KEY";
export const ENCRYPTION_PREFIX = "enc:v1:";

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export type EncryptionKeyId = "primary" | "legacy";

const KEY_ID_ENV: Record<EncryptionKeyId, string> = {
  primary: PRIMARY_KEY_ENV,
  legacy: LEGACY_KEY_ENV,
};

function isEncryptionKeyId(value: string): value is EncryptionKeyId {
  return value === "primary" || value === "legacy";
}

export function getEncryptionKey(keyId: EncryptionKeyId): Buffer {
  const envName = KEY_ID_ENV[keyId];
  const key = process.env[envName];

  if (!key) {
    throw new Error(
      `Missing ${envName} environment variable. Set it before using encrypted secrets.`,
    );
  }

  return createHash("sha256").update(key).digest();
}

export function encryptSecret(
  secret: string,
  keyId: EncryptionKeyId = "primary",
): string {
  const key = getEncryptionKey(keyId);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${ENCRYPTION_PREFIX}${keyId}:${payload}`;
}

export function decryptSecret(encrypted: string): string {
  if (!encrypted.startsWith(ENCRYPTION_PREFIX)) {
    throw new Error(
      "Invalid encrypted secret format: missing enc:v1: prefix.",
    );
  }

  const withoutPrefix = encrypted.slice(ENCRYPTION_PREFIX.length);
  const keyIdSeparator = withoutPrefix.indexOf(":");

  if (keyIdSeparator === -1) {
    throw new Error(
      "Invalid encrypted secret format: missing keyId. Integration secrets must use the enc:v1:<keyId>:<payload> format.",
    );
  }

  const keyIdSegment = withoutPrefix.slice(0, keyIdSeparator);

  if (!isEncryptionKeyId(keyIdSegment)) {
    throw new Error(
      `Invalid encrypted secret format: unknown keyId "${keyIdSegment}". Expected one of the known key IDs (primary, legacy).`,
    );
  }

  const payload = withoutPrefix.slice(keyIdSeparator + 1);
  const buffer = Buffer.from(payload, "base64");

  if (buffer.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error(
      "Invalid encrypted secret: payload is too short to contain an IV and auth tag.",
    );
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const value = buffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(keyIdSegment), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(value), decipher.final()]).toString(
    "utf8",
  );
}
