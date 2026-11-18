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
 * The directory a key lives in, used to prove a rendition belongs to the Media
 * that the database resolved for it.
 */
export function parentKeyPrefix(key: string, depth = 3): string {
  return key.split("/").slice(0, depth).join("/");
}
