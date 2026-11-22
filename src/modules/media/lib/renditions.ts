import type { MediaRenditionFormat } from "../types";

/**
 * The part of a rendition a location-only reader needs: the key its object
 * lives under, the width and format its filename encodes, and the optional
 * size facts the manifest may carry. The address sweep only needs the
 * location, so a legacy entry without a byte count is still a rendition it
 * can address.
 */
export interface MediaRenditionLocation {
  key: string;
  width: number;
  format: MediaRenditionFormat;
  height?: number;
  bytes?: number;
  /**
   * The address resolved when the copy was written. Absent on a legacy entry
   * whose address still lives in the Media's delivery token.
   */
  url?: string;
}

function isFormat(value: unknown): value is MediaRenditionFormat {
  return value === "avif" || value === "webp";
}

export function isMediaRenditionLocation(
  value: unknown,
): value is MediaRenditionLocation {
  if (typeof value !== "object" || value === null) return false;

  const rendition = value as Record<string, unknown>;

  return (
    typeof rendition.key === "string" &&
    rendition.key.length > 0 &&
    typeof rendition.width === "number" &&
    Number.isFinite(rendition.width) &&
    rendition.width > 0 &&
    isFormat(rendition.format)
  );
}

/**
 * The renditions a Media's manifest locates. An entry without a key or a width
 * cannot be addressed without guessing, so it is left out rather than invented.
 */
export function mediaRenditionLocations(
  value: unknown,
): MediaRenditionLocation[] {
  return Array.isArray(value) ? value.filter(isMediaRenditionLocation) : [];
}
