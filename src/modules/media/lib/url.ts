import {
  LEGACY_ASSET_PREFIX,
  UPLOADTHING_FILE_PATH,
} from "./image-ladder.mjs";

const UPLOADTHING_HOST_SUFFIXES = [".ufs.sh", "utfs.io"];
const PICTURES_WRITERS_HOST_SUFFIXES = [
  "pictureswriters.com",
  ".pictureswriters.com",
];

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

export function isPicturesWritersUrl(url: URL): boolean {
  return matchesHost(url.hostname, PICTURES_WRITERS_HOST_SUFFIXES);
}

/**
 * Origin a browser will actually fetch an absolute UploadThing image from.
 * UploadThing serves both `.ufs.sh` and `utfs.io` hosts, so callers must
 * preconnect to the URL's origin instead of assuming a single CDN hostname.
 */
export function getUploadThingOrigin(src: string): string | null {
  const { url, absolute } = parseSrc(src);

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

export function storageKeyFromMediaUrl(src: string): string | null {
  const { url, absolute } = parseSrc(src);

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
