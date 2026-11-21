import type { Prisma } from "@/generated/prisma";

/**
 * The columns every read of a stored file's location needs: the key the driver
 * addresses, the driver that owns it, the provider address when it is remote,
 * and the facts a library row renders. It lives outside `server/` so delivery,
 * the backfills, the quota and the admin library share one projection.
 */
export const storedFileLocationSelect = {
  key: true,
  driver: true,
  remoteUrl: true,
  contentType: true,
  size: true,
  checksum: true,
} satisfies Prisma.StoredFileSelect;

export type StoredFileLocationRow = Prisma.StoredFileGetPayload<{
  select: typeof storedFileLocationSelect;
}>;

export interface MediaStorageLocation {
  key: string;
  driver: string;
  contentType: string | null;
  size: number | null;
  checksum: string | null;
}

/**
 * Where a Media's original bytes are: the stored-file record is the only
 * answer. A Media without one has no key, no driver and no facts to render.
 */
export function mediaStoredLocation(
  record: StoredFileLocationRow | null,
): MediaStorageLocation | null {
  if (!record) return null;

  return {
    key: record.key,
    driver: record.driver,
    contentType: record.contentType,
    size: record.size,
    checksum: record.checksum,
  };
}
