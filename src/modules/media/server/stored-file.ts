import "server-only";

import type { Prisma } from "@/generated/prisma";
import { StoredFileKind, StoredFileOrigin } from "@/generated/prisma";

import {
  LEGACY_ASSET_PREFIX,
  UPLOADTHING_FILE_ORIGIN,
  UPLOADTHING_FILE_PATH,
} from "@/modules/media/lib/image-ladder.mjs";
import { stripMediaManifest } from "@/modules/media/lib/manifest";
import { parseSrc } from "@/modules/media/lib/url";

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
 * The provider address already encoded by a stored address. An absolute
 * address is used as it is, minus the rendition token, which is not part of
 * the object. The legacy `/assets/<key>` shape is the installation's rewrite
 * to the provider, so the library knows where those bytes are without asking
 * the provider. Every other relative address is local.
 */
export function remoteUrlForAddress(address: string): string | null {
  const { url, absolute } = parseSrc(address);

  if (absolute) return stripMediaManifest(address);

  if (url.pathname.startsWith(LEGACY_ASSET_PREFIX)) {
    const key = url.pathname.slice(LEGACY_ASSET_PREFIX.length);
    return key
      ? `${UPLOADTHING_FILE_ORIGIN}${UPLOADTHING_FILE_PATH}${key}`
      : null;
  }

  return null;
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
 * The row a Media's location record is created from. The role and the origin
 * are decided here, so no write site can record a Media as another kind.
 */
export function mediaStoredFileCreateData(
  mediaId: string,
  location: StoredFileLocation,
): Prisma.StoredFileUncheckedCreateInput {
  return {
    ...location,
    kind: StoredFileKind.MEDIA,
    origin: StoredFileOrigin.INTERNAL,
    mediaId,
  };
}

/**
 * Creates the StoredFile of a Media inside the transaction that creates or
 * updates the Media itself. A failed or refused write therefore leaves neither
 * bytes nor a row.
 */
export function createStoredFileForMedia(
  tx: Prisma.TransactionClient,
  mediaId: string,
  location: StoredFileLocation,
) {
  return tx.storedFile.create({
    data: mediaStoredFileCreateData(mediaId, location),
  });
}
