import "server-only";

import { getInstallationSlug } from "./storage/driver";

/**
 * The namespaced storage layout written by the media service. Keys are the
 * truth and every object of one revision shares this prefix, so the layout is
 * parsed here and nowhere else.
 */
export interface MediaKeyParts {
  installationSlug: string;
  mediaId: string;
  revision: number;
  file: string;
}

export function mediaRevisionPrefix(
  mediaId: string,
  revision: number,
  installationSlug: string = getInstallationSlug(),
): string {
  return `${installationSlug}/${mediaId}/${revision}/`;
}

export function mediaStoragePrefix(
  mediaId: string,
  installationSlug: string = getInstallationSlug(),
): string {
  return `${installationSlug}/${mediaId}/`;
}

/**
 * The directory a key lives in, or `null` for a flat provider key. Removing a
 * revision is removing one such directory, so the segment logic stays here
 * with the grammar it describes.
 */
export function mediaKeyDirectory(key: string): string | null {
  const separator = key.lastIndexOf("/");
  return separator > 0 ? key.slice(0, separator + 1) : null;
}

/**
 * The directory that owns every object of one Media. A namespaced key belongs
 * to `<installationSlug>/<mediaId>/`, so removing that prefix removes every
 * revision an interrupted operation might have left behind. A key without one
 * — a provider file key written before the namespace — has no directory, and
 * its exact key is the unit of cleanup.
 */
export function mediaStoragePrefixForKey(
  mediaId: string,
  key: string | null,
  installationSlug: string = getInstallationSlug(),
): string {
  const parsed = key ? parseMediaKey(key) : null;

  return parsed
    ? mediaStoragePrefix(parsed.mediaId, parsed.installationSlug)
    : mediaStoragePrefix(mediaId, installationSlug);
}

/**
 * Whether a storage key is the original or a rendition of one revision.
 */
export function isMediaRevisionKey(
  mediaId: string,
  revision: number,
  key: string,
  installationSlug: string = getInstallationSlug(),
): boolean {
  return key.startsWith(mediaRevisionPrefix(mediaId, revision, installationSlug));
}

/**
 * Parses a namespaced key into its parts, returning `null` for a legacy flat
 * key or a shape this layout does not own.
 */
export function parseMediaKey(key: string): MediaKeyParts | null {
  const segments = key.split("/");
  if (segments.length !== 4) return null;

  const [installationSlug, mediaId, rawRevision, file] = segments;
  if (!installationSlug || !mediaId || !file) return null;

  const revision = Number(rawRevision);
  if (!Number.isInteger(revision) || revision < 1) return null;

  return { installationSlug, mediaId, revision, file };
}

/**
 * Parses a delivery key into the parts needed to resolve its owning Media.
 * Accepts both the current four-segment layout and the legacy three-segment
 * layout (`<mediaId>/<revision>/<file>`) that pre-dates the installation slug.
 * Flat provider keys return `null`.
 */
export function parseMediaDeliveryKey(key: string): {
  mediaId: string;
  revision: number;
  file: string;
} | null {
  const segments = key.split("/");
  if (segments.length !== 3 && segments.length !== 4) return null;

  const legacy = segments.length === 3;
  const mediaId = legacy ? segments[0] : segments[1];
  const rawRevision = legacy ? segments[1] : segments[2];
  const file = legacy ? segments[2] : segments[3];

  if (!mediaId || !file) return null;

  const revision = Number(rawRevision);
  if (!Number.isInteger(revision) || revision < 1) return null;

  return { mediaId, revision, file };
}

/**
 * The directory a key lives in, used to prove a rendition belongs to the Media
 * that the database resolved for it.
 */
export function parentKeyPrefix(key: string, depth = 3): string {
  return key.split("/").slice(0, depth).join("/");
}
