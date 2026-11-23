import "server-only";

import type { StorageDriver } from "./storage/types";

/** The bytes and the address an HTTP read answered with. */
export interface FetchedObject {
  bytes: Uint8Array<ArrayBuffer>;
  address: string;
}

function isAbsoluteAddress(
  address: string | null | undefined,
): address is string {
  if (!address) return false;

  try {
    new URL(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads one object from an absolute address. A transport failure or a timeout
 * is retried, because a batch over a few hundred provider objects must not
 * strand a file on one slow response; a 404 or a 403 is an answer and is not
 * retried. Returns `null` when the address does not serve bytes.
 */
export async function fetchObject(
  address: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchedObject | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(address, {
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) return null;

      return {
        bytes: new Uint8Array(await response.arrayBuffer()),
        address,
      };
    } catch {
      // Try again; a 404 or a 403 is not retried because it is an answer.
    }
  }

  return null;
}

export interface ReadObjectOptions {
  key: string;
  /** The address the record carries, when it has one. */
  address?: string | null;
  /**
   * The driver that owns the key, resolved only when the address does not
   * serve the bytes. Omit it when no driver is reachable from this instance.
   */
  loadDriver?: () => StorageDriver | null;
  fetchImpl?: typeof fetch;
}

/**
 * The bytes of one stored object, read the way delivery reaches them: the
 * address the record (or its rendition manifest entry) carries first, the
 * driver's `get` only as the fallback.
 *
 * A provider's key API may no longer resolve a pre-seam key while its recorded
 * address keeps serving the bytes, so reading the key first would report most
 * of a backfilled library as unreadable. A relative address names this site and
 * is never fetched here. Returns `null` when neither path serves the bytes.
 */
export async function readObject({
  key,
  address,
  loadDriver,
  fetchImpl = fetch,
}: ReadObjectOptions): Promise<Uint8Array<ArrayBuffer> | null> {
  if (isAbsoluteAddress(address)) {
    const fetched = await fetchObject(address, fetchImpl);
    if (fetched) return fetched.bytes;
  }

  const driver = loadDriver?.();
  if (!driver) return null;

  try {
    return await driver.get(key);
  } catch {
    return null;
  }
}
