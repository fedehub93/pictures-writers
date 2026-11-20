import { storedFilePath } from "./file-path";
import {
  LEGACY_ASSET_PREFIX,
  MEDIA_PATH_PREFIX,
  UPLOADTHING_FILE_ORIGIN,
  UPLOADTHING_FILE_PATH,
} from "./image-ladder.mjs";

const UPLOADTHING_HOST_SUFFIXES = [".ufs.sh", "utfs.io"];

export interface ParsedSrc {
  url: URL;
  absolute: boolean;
}

export function parseSrc(src: string): ParsedSrc {
  try {
    return { url: new URL(src), absolute: true };
  } catch {
    return { url: new URL(src, "http://media.local"), absolute: false };
  }
}

/**
 * The canonical, provider-independent media address for a storage key.
 * `Media.url` stores this relative form so the database never carries a domain.
 * Composing a Media address is one role of the shared file composer.
 */
export function mediaPath(key: string): string {
  return storedFilePath("MEDIA", key);
}

export function serializeSrc(url: URL, absolute: boolean): string {
  if (absolute) return url.toString();

  return `${url.pathname}${url.search}${url.hash}`;
}

function matchesHost(
  hostname: string,
  suffixes: readonly string[],
): boolean {
  const host = hostname.toLowerCase();

  return suffixes.some(
    (suffix) => host === suffix.replace(/^\./, "") || host.endsWith(suffix),
  );
}

export function isUploadThingUrl(url: URL): boolean {
  return matchesHost(url.hostname, UPLOADTHING_HOST_SUFFIXES);
}

/**
 * Origin a browser will actually fetch an UploadThing image from. Legacy
 * relative `/assets/<key>` URLs are rewritten by the loader to the `.ufs.sh`
 * origin, while modern images use either `.ufs.sh` or `utfs.io`; callers must
 * preconnect to the effective origin instead of assuming a single hostname.
 */
export function getUploadThingOrigin(src: string): string | null {
  const { url, absolute } = parseSrc(src);

  if (!absolute && url.pathname.startsWith(LEGACY_ASSET_PREFIX)) {
    return UPLOADTHING_FILE_ORIGIN;
  }

  return absolute && isUploadThingUrl(url) ? url.origin : null;
}

/**
 * Only browser-fetchable rendition URLs are allowed into an `<img src>`. The
 * token that carries them is client input, so reject data/blob/javascript
 * schemes instead of trusting it.
 */
export function isSafeRenditionUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Legacy Media rows may not carry a `key`. Their URL still identifies the
 * object when it is one of the shapes the storage seam understands, which is
 * enough to read them back during the metadata backfill.
 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * The key a Media's original lives under: the recorded column when present,
 * otherwise the key its address encodes. Legacy rows may carry no key, and an
 * address that encodes none leaves the object unreachable.
 */
export function mediaSourceKey(media: {
  key: string | null;
  url: string;
}): string | null {
  if (typeof media.key === "string" && media.key.length > 0) return media.key;

  const key = storageKeyFromMediaUrl(media.url);

  return key && key.length > 0 ? key : null;
}

export function storageKeyFromMediaUrl(src: string): string | null {
  const { url, absolute } = parseSrc(src);

  if (url.pathname.startsWith(MEDIA_PATH_PREFIX + "/")) {
    return safeDecode(url.pathname.slice(MEDIA_PATH_PREFIX.length + 1));
  }

  if (url.pathname.startsWith(LEGACY_ASSET_PREFIX)) {
    return safeDecode(url.pathname.slice(LEGACY_ASSET_PREFIX.length));
  }

  if (
    absolute &&
    isUploadThingUrl(url) &&
    url.pathname.startsWith(UPLOADTHING_FILE_PATH)
  ) {
    return safeDecode(url.pathname.slice(UPLOADTHING_FILE_PATH.length));
  }

  return null;
}
