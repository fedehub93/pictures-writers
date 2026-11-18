/**
 * The storage drivers an Installation can choose between.
 *
 * Client-safe and dependency-free: the media library renders the choice from
 * the same values the settings API validates, so there is no second source of
 * truth for what "a driver" means.
 */

export const STORAGE_DRIVERS = ["local", "uploadthing"] as const;

export type StorageDriverName = (typeof STORAGE_DRIVERS)[number];

/** Human labels for the admin-facing choice. */
export const STORAGE_DRIVER_LABELS: Record<StorageDriverName, string> = {
  local: "Local disk",
  uploadthing: "UploadThing",
};

/**
 * The media library's view of the choice: the driver the next upload will use,
 * and whether UploadThing can be offered at all.
 */
export interface StorageDriverChoice {
  active: StorageDriverName;
  uploadThingAvailable: boolean;
}

/**
 * Parses a driver submitted by the backoffice or read from Installation
 * settings. Only the exact names are accepted: an unknown value is rejected
 * rather than falling through to a default, so a typo never silently changes
 * where an upload lands.
 */
export function parseStorageDriver(value: unknown): StorageDriverName | null {
  return typeof value === "string" &&
    (STORAGE_DRIVERS as readonly string[]).includes(value)
    ? (value as StorageDriverName)
    : null;
}
