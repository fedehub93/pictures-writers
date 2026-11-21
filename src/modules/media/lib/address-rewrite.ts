import {
  storedFileAddress,
  storedFilePath,
  type StoredFileRole,
} from "./file-path";
import { LEGACY_ASSET_PREFIX } from "./image-ladder.mjs";
import { composeMediaAddress } from "./media-address";
import {
  decodeMediaManifest,
  MEDIA_MANIFEST_PARAM,
} from "./manifest";
import { mediaRenditionLocations } from "./renditions";
import {
  isUploadThingUrl,
  parseSrc,
  storageKeyFromMediaUrl,
} from "./url";

/**
 * Where one stored file answers after the sweep. `fileId` is reported, never
 * the address, so the operator can count the files a run touched without the
 * report carrying a key or a provider host.
 */
export interface StoredAddressTarget {
  fileId: string;
  address: string;
}

/**
 * The two lookups a rewrite needs: every old address the library already
 * knew (a provider address, the Media's own delivery URL) and every storage
 * key that resolves, renditions included.
 */
export interface StoredAddressIndex {
  byAddress: ReadonlyMap<string, StoredAddressTarget>;
  byKey: ReadonlyMap<string, StoredAddressTarget>;
}

/**
 * One stored file as the sweep sees it. `media` is present only for a library
 * Media; an attachment or an avatar is addressed by its role and key alone.
 */
export interface StoredAddressIndexEntry {
  fileId: string;
  key: string;
  role: StoredFileRole;
  remoteUrl: string | null;
  media?: {
    revision: number;
    archived: boolean;
    renditions: unknown;
  } | null;
}

export interface AddressRewriteResult {
  value: unknown;
  /** Addresses replaced with a canonical one. */
  rewritten: number;
  /** File addresses that look like one but no stored file owns. */
  unresolved: number;
  /** Stored files a rewritten address points at, duplicates included. */
  fileIds: string[];
}

/**
 * The canonical address of a Media inside content: its `/media/<key>` path,
 * plus a rendition token whose rendition URLs are the Installation's own
 * `/media/<renditionKey>` paths. A rendition is named only when its manifest
 * recorded an address, because that is what delivery resolves it through.
 */
export function canonicalMediaAddress(
  key: string,
  media: NonNullable<StoredAddressIndexEntry["media"]>,
): string {
  // A rendition answers only under the original's revision prefix; the
  // delivery route proves ownership the same way. A legacy key that cannot
  // own the rendition leaves it out instead of writing an address that 404s.
  const prefix = `${key.split("/").slice(0, 3).join("/")}/`;
  const renditions = mediaRenditionLocations(media.renditions).filter(
    (rendition) => rendition.key.startsWith(prefix) && rendition.url,
  );

  if (renditions.length === 0) {
    return storedFilePath("MEDIA", key);
  }

  return composeMediaAddress(key, {
    revision: media.revision,
    archived: media.archived,
    renditions: renditions.map((rendition) => ({
      width: rendition.width,
      format: rendition.format,
      url: storedFilePath("MEDIA", rendition.key),
    })),
  });
}

/**
 * Builds the answer to "what is the canonical address of this file" for every
 * file the Installation records. A rendition has no record of its own, so its
 * key is added beside its Media's original.
 */
export function buildStoredAddressIndex(
  entries: readonly StoredAddressIndexEntry[],
): StoredAddressIndex {
  const byKey = new Map<string, StoredAddressTarget>();
  const byAddress = new Map<string, StoredAddressTarget>();

  for (const entry of entries) {
    if (entry.key.length === 0) continue;

    const target: StoredAddressTarget = {
      fileId: entry.fileId,
      address: entry.media
        ? canonicalMediaAddress(entry.key, entry.media)
        : storedFilePath(entry.role, entry.key),
    };

    byKey.set(entry.key, target);
    if (entry.remoteUrl) byAddress.set(entry.remoteUrl, target);
  }

  for (const entry of entries) {
    if (!entry.media) continue;

    for (const rendition of mediaRenditionLocations(entry.media.renditions)) {
      if (byKey.has(rendition.key)) continue;

      byKey.set(rendition.key, {
        fileId: entry.fileId,
        address: storedFilePath("MEDIA", rendition.key),
      });
    }
  }

  return { byAddress, byKey };
}

/**
 * A candidate is an address the sweep is responsible for: a provider URL, one
 * of the Installation's own file addresses, the legacy `/assets/` rewrite, or
 * an exact address the library already recorded. An ordinary external link is
 * left alone.
 */
export function isFileAddressCandidate(
  src: string,
  index: StoredAddressIndex,
): boolean {
  if (index.byAddress.has(src)) return true;

  const { url, absolute } = parseSrc(src);

  if (absolute) return isUploadThingUrl(url);

  if (storedFileAddress(src)) return true;

  return url.pathname.startsWith(LEGACY_ASSET_PREFIX);
}

/**
 * Whether an address is already the canonical relative form. A Media address
 * may carry the rendition token; every rendition it names must itself be
 * relative and free of the legacy `/assets/` shape, or the token is rewritten
 * with the canonical rendition addresses.
 */
function isCanonicalAddress(
  src: string,
  index: StoredAddressIndex,
): boolean {
  const { url, absolute } = parseSrc(src);
  if (absolute) return false;

  const address = storedFileAddress(src);
  if (!address) {
    if (url.pathname.startsWith(LEGACY_ASSET_PREFIX)) return false;

    // An exact recorded address that is not an own file address, such as an
    // external provider's URL, is never canonical.
    return !index.byAddress.has(src);
  }

  const target = index.byKey.get(address.key);
  if (!target) return false;

  const targetArea = storedFileAddress(target.address)?.area;
  if (targetArea && targetArea !== address.area) return false;

  if (address.area === "files") return url.search === "";

  if (url.pathname !== storedFilePath("MEDIA", address.key)) return false;

  const token = url.searchParams.get(MEDIA_MANIFEST_PARAM);
  if (!token) return url.search === "";

  const manifest = decodeMediaManifest(token);
  if (!manifest) return false;

  return manifest.renditions.every((rendition) => {
    if (!rendition.url.startsWith("/") || rendition.url.startsWith("//")) {
      return false;
    }

    return !parseSrc(rendition.url).url.pathname.startsWith(
      LEGACY_ASSET_PREFIX,
    );
  });
}

function resolveTarget(
  src: string,
  index: StoredAddressIndex,
): StoredAddressTarget | null {
  const exact = index.byAddress.get(src);
  if (exact) return exact;

  const address = storedFileAddress(src);
  if (address) return index.byKey.get(address.key) ?? null;

  const key = storageKeyFromMediaUrl(src);
  if (key) return index.byKey.get(key) ?? null;

  return null;
}

/**
 * A URL as it appears in prose or an HTML attribute, without the punctuation
 * that ended the sentence or the markup. The tail is put back untouched.
 */
function splitTrailingPunctuation(match: string): {
  candidate: string;
  tail: string;
} {
  let end = match.length;

  while (end > 0 && ".,;:!?".includes(match[end - 1]!)) end -= 1;

  return { candidate: match.slice(0, end), tail: match.slice(end) };
}

function addressPattern(): RegExp {
  return /(?:https?:\/\/|\/assets\/|\/media\/|\/files\/)[^\s"'<>()\\]+/gi;
}

/**
 * Rewrites the file addresses inside one string. A provider address, an
 * absolute own-domain address or the legacy `/assets/` shape becomes the
 * canonical address of the stored file it names; an address no stored file
 * owns is counted and left exactly as it was.
 */
export function rewriteAddressesInString(
  source: string,
  index: StoredAddressIndex,
): AddressRewriteResult & { value: string } {
  let rewritten = 0;
  let unresolved = 0;
  const fileIds: string[] = [];

  const value = source.replace(addressPattern(), (match) => {
    const { candidate, tail } = splitTrailingPunctuation(match);

    if (!isFileAddressCandidate(candidate, index)) return match;

    const target = resolveTarget(candidate, index);
    if (!target) {
      unresolved += 1;
      return match;
    }

    if (isCanonicalAddress(candidate, index)) return match;
    if (target.address === candidate) return match;

    rewritten += 1;
    fileIds.push(target.fileId);

    return `${target.address}${tail}`;
  });

  return { value, rewritten, unresolved, fileIds };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Rewrites every string anywhere inside a JSON value, leaving its shape and
 * every non-string value untouched. Content fields are opaque JSON, so this is
 * the only walk that can reach an image source inside a Puck block or a TipTap
 * node without knowing either schema.
 */
export function rewriteAddressesInValue(
  value: unknown,
  index: StoredAddressIndex,
): AddressRewriteResult {
  if (typeof value === "string") {
    return rewriteAddressesInString(value, index);
  }

  if (Array.isArray(value)) {
    let rewritten = 0;
    let unresolved = 0;
    const fileIds: string[] = [];
    let changed = false;

    const next = value.map((item) => {
      const result = rewriteAddressesInValue(item, index);
      rewritten += result.rewritten;
      unresolved += result.unresolved;
      fileIds.push(...result.fileIds);
      if (result.rewritten > 0) changed = true;
      return result.value;
    });

    return { value: changed ? next : value, rewritten, unresolved, fileIds };
  }

  if (isPlainObject(value)) {
    let rewritten = 0;
    let unresolved = 0;
    const fileIds: string[] = [];
    let changed = false;

    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      const result = rewriteAddressesInValue(nested, index);
      rewritten += result.rewritten;
      unresolved += result.unresolved;
      fileIds.push(...result.fileIds);
      if (result.rewritten > 0) changed = true;
      next[key] = result.value;
    }

    return { value: changed ? next : value, rewritten, unresolved, fileIds };
  }

  return { value, rewritten: 0, unresolved: 0, fileIds: [] };
}
