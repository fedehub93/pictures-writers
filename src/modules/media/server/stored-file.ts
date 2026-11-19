import "server-only";

import type { Prisma } from "@/generated/prisma";
import { StoredFileKind, StoredFileOrigin } from "@/generated/prisma";

import type { StorageDriver, StorageDriverName } from "./storage";

/**
 * The part of a StoredFile that answers "where are the bytes": the key the
 * driver addresses, the driver that owns it, and the provider address when the
 * driver is remote. The role (Media, Attachment, Avatar) lives on the row this
 * record is attached to.
 */
export interface StoredFileLocation {
  key: string;
  driver: string;
  remoteUrl: string | null;
  contentType: string | null;
  size: number | null;
  checksum: string | null;
}

/**
 * The provider address of a newly written object. A local file has none: its
 * canonical address is `/media/<key>` and the bytes are on this server.
 */
export async function remoteUrlForUpload(
  driver: StorageDriver,
  driverName: StorageDriverName,
  key: string,
): Promise<string | null> {
  return driverName === "local" ? null : driver.url(key);
}

/**
 * Creates the StoredFile of a Media inside the transaction that creates the
 * Media itself. A failed or refused upload therefore leaves neither bytes nor
 * a row.
 */
export function createStoredFileForMedia(
  tx: Prisma.TransactionClient,
  mediaId: string,
  location: StoredFileLocation,
) {
  return tx.storedFile.create({
    data: {
      ...location,
      kind: StoredFileKind.MEDIA,
      origin: StoredFileOrigin.INTERNAL,
      mediaId,
    },
  });
}
