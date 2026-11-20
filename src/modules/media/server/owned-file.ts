import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { Prisma, StoredFileKind, StoredFileOrigin } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  storedFilePath,
  type StoredFileRole,
} from "@/modules/media/lib/file-path";

import {
  getInstallationSlug,
  resolveActiveStorageDriver,
  resolveMediaStorageDriver,
  StorageObjectNotFoundError,
  type StorageDriverName,
  type StorageDriver,
} from "./storage";
import { remoteUrlForUpload } from "./stored-file";

const MAX_FILENAME_LENGTH = 120;

/**
 * A filename that is safe as one storage-key segment and still recognisable in
 * the delivery address. The original filename is kept on the Attachment role.
 */
export function safeFileSegment(filename: string): string {
  const cleaned = filename
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, MAX_FILENAME_LENGTH);

  return cleaned || "file";
}

function roleForKind(kind: StoredFileKind): StoredFileRole {
  switch (kind) {
    case StoredFileKind.MEDIA:
      return "MEDIA";
    case StoredFileKind.ATTACHMENT:
      return "ATTACHMENT";
    case StoredFileKind.AVATAR:
      return "AVATAR";
  }
}

/** The namespaced key of one owned file: one id, one revision, one object. */
export function ownedFileKey(
  id: string,
  filename: string,
  installationSlug: string = getInstallationSlug(),
): string {
  return `${installationSlug}/${id}/1/${safeFileSegment(filename)}`;
}

export interface StoreOwnedFileInput {
  kind: StoredFileKind;
  filename: string;
  contentType: string;
  bytes: Uint8Array<ArrayBuffer>;
  origin?: StoredFileOrigin;
}

export interface StoredOwnedFile {
  id: string;
  key: string;
  driver: StorageDriverName;
  remoteUrl: string | null;
  contentType: string;
  size: number;
  /** The canonical address on the Installation's own domain. */
  address: string;
}

/**
 * Writes one attachment or avatar through the active driver and records where
 * its bytes are in the same step. The browser never picks the driver and the
 * address never names it. A failed write leaves neither bytes nor a row.
 */
export async function storeOwnedFile({
  kind,
  filename,
  contentType,
  bytes,
  origin = StoredFileOrigin.INTERNAL,
}: StoreOwnedFileInput): Promise<StoredOwnedFile> {
  const { driver, name } = await resolveActiveStorageDriver();
  const id = randomUUID();
  const key = ownedFileKey(id, filename);
  const checksum = createHash("sha256").update(bytes).digest("hex");

  await driver.put(key, bytes, contentType);

  try {
    const remoteUrl = await remoteUrlForUpload(driver, name, key);
    const record = await db.storedFile.create({
      data: {
        id,
        key,
        driver: name,
        remoteUrl,
        contentType,
        size: bytes.byteLength,
        checksum,
        kind,
        origin,
      },
      select: { id: true, key: true, driver: true, remoteUrl: true },
    });

    return {
      id: record.id,
      key: record.key,
      driver: name,
      remoteUrl: record.remoteUrl,
      contentType,
      size: bytes.byteLength,
      address: storedFilePath(roleForKind(kind), record.key),
    };
  } catch (error) {
    // A record that never existed must not leave bytes behind either.
    await driver.delete(key).catch(() => undefined);
    throw error;
  }
}

const ownedLocationSelect = {
  id: true,
  key: true,
  driver: true,
} satisfies Prisma.StoredFileSelect;

export type OwnedFileLocation = Prisma.StoredFileGetPayload<{
  select: typeof ownedLocationSelect;
}>;

export interface OwnedFileCleanupFailure {
  fileId: string;
  /** Why the objects or the record could not be removed. */
  reason: string;
}

/**
 * The one way a caller reports cleanup failures. A failed cleanup never fails
 * the operation that owned the file; it is logged with file ids and reasons
 * and the record is left for the audit.
 */
export function reportOwnedFileCleanupFailures(
  context: Record<string, unknown>,
  failures: OwnedFileCleanupFailure[],
): void {
  if (failures.length === 0) return;

  console.error("[STORED_FILE_CLEANUP] owned files were not removed", {
    ...context,
    failures,
  });
}

function isRecordAlreadyGone(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

/**
 * Removes the objects of owned files through the driver recorded on each one,
 * then removes the record. A driver that is not configured here, a storage
 * failure, or a record still referenced by a role leaves the record in place
 * and is reported: the location is never lost.
 */
export async function deleteOwnedFileObjects(
  files: OwnedFileLocation[],
): Promise<OwnedFileCleanupFailure[]> {
  if (files.length === 0) return [];

  const active = await resolveActiveStorageDriver();
  const drivers = new Map<StorageDriverName, StorageDriver>([
    [active.name, active.driver],
  ]);
  const failures: OwnedFileCleanupFailure[] = [];

  for (const file of files) {
    const resolution = resolveMediaStorageDriver(file.driver, {
      active,
      cache: drivers,
    });

    if (!resolution.resolved) {
      failures.push({ fileId: file.id, reason: resolution.reason });
      continue;
    }

    try {
      await db.$transaction(
        async (transaction) => {
          // The record goes first so the role foreign key can refuse the delete
          // before any byte is touched. The object removal is inside the same
          // transaction: if it fails, the record comes back and the location is
          // not lost.
          await transaction.storedFile.delete({ where: { id: file.id } });

          try {
            await resolution.driver.delete(file.key);
          } catch (error) {
            if (!(error instanceof StorageObjectNotFoundError)) throw error;
          }
        },
        { timeout: 30_000 },
      );
    } catch (error) {
      if (isRecordAlreadyGone(error)) continue;

      console.error("[STORED_FILE_DELETE] Could not remove the owned file", {
        fileId: file.id,
      });
      failures.push({ fileId: file.id, reason: "delete-failed" });
    }
  }

  return failures;
}

/**
 * The avatar objects a user owns, removed before the user row goes. Called
 * from the auth layer's user-delete hook; a failure leaves the record behind
 * for the audit rather than losing where the bytes are.
 */
export async function deleteUserAvatarObjects(
  userId: string,
): Promise<OwnedFileCleanupFailure[]> {
  const file = await db.storedFile.findUnique({
    where: { avatarOwnerId: userId },
    select: ownedLocationSelect,
  });

  return file ? deleteOwnedFileObjects([file]) : [];
}
