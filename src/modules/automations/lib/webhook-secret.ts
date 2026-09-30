import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Webhook secret hashing/verification.
 *
 * The raw secret is never stored: the Automation keeps only `sha256(secret)`
 * as hex. A caller presents the raw secret in the `x-automation-secret` header;
 * we hash it and compare the digests in constant time.
 */

const HASH_PATTERN = /^[0-9a-f]{64}$/;

export function hashWebhookSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function verifyWebhookSecret(
  provided: string | null | undefined,
  storedHash: string | null | undefined,
): boolean {
  if (!provided || !storedHash || !HASH_PATTERN.test(storedHash)) {
    return false;
  }

  const providedDigest = createHash("sha256").update(provided).digest();
  const storedDigest = Buffer.from(storedHash, "hex");

  if (providedDigest.length !== storedDigest.length) {
    return false;
  }

  return timingSafeEqual(providedDigest, storedDigest);
}
