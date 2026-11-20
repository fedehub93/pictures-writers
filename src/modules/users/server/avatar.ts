import "server-only";

import { Prisma, StoredFileKind } from "@/generated/prisma";

import {
  storedFileAddress,
  storedFilePath,
} from "@/modules/media/lib/file-path";

export const avatarLocationSelect = {
  id: true,
  key: true,
  driver: true,
} satisfies Prisma.StoredFileSelect;

export type OwnedAvatar = Prisma.StoredFileGetPayload<{
  select: typeof avatarLocationSelect;
}>;

export class AvatarFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvatarFileError";
  }
}

export interface AvatarClaim {
  /** The address to write on the user, or `null` to clear the avatar. */
  imageUrl: string | null;
  /** The file that stopped being this user's avatar and can be cleaned up. */
  previous: OwnedAvatar | null;
}

async function releaseAvatar(
  tx: Prisma.TransactionClient,
  previous: OwnedAvatar | null,
): Promise<void> {
  if (!previous) return;

  await tx.storedFile.update({
    where: { id: previous.id },
    data: { avatarOwnerId: null },
  });
}

function isAbsoluteHttpAddress(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Turns the avatar address the admin form saved into ownership of a stored
 * file. A `/files/<key>` address must name an unowned AVATAR record, so a
 * library Media or another user's avatar cannot be claimed by typing its
 * address. A library Media address and an external image stay unowned.
 *
 * The user row is written by the caller in the same transaction; the returned
 * `previous` file is cleaned up after that transaction commits.
 */
export async function claimAvatar(
  tx: Prisma.TransactionClient,
  userId: string,
  rawImageUrl: string | null | undefined,
): Promise<AvatarClaim> {
  const normalized = rawImageUrl?.trim() || null;
  const previous = await tx.storedFile.findUnique({
    where: { avatarOwnerId: userId },
    select: avatarLocationSelect,
  });

  if (!normalized) {
    await releaseAvatar(tx, previous);

    return { imageUrl: null, previous };
  }

  // Ownership is claimed only from a relative address this Installation
  // composed. An absolute URL is somebody else's address until a boundary makes
  // ours absolute, so it can never be used to claim a stored file by key.
  const absolute = /^[a-z][a-z0-9+.-]*:/i.test(normalized);
  const address = absolute ? null : storedFileAddress(normalized);

  if (address?.area === "files") {
    const file = await tx.storedFile.findUnique({
      where: { key: address.key },
      select: { ...avatarLocationSelect, kind: true, avatarOwnerId: true },
    });

    if (!file || file.kind !== StoredFileKind.AVATAR) {
      throw new AvatarFileError(
        "The avatar image could not be found. Upload it again and retry.",
      );
    }

    if (file.avatarOwnerId && file.avatarOwnerId !== userId) {
      throw new AvatarFileError("That avatar belongs to another user.");
    }

    // Release the old file before claiming the new one: `avatarOwnerId` is
    // unique, so a user can own exactly one avatar at any moment.
    const replaced = previous && previous.id !== file.id ? previous : null;
    await releaseAvatar(tx, replaced);

    const next = await tx.storedFile.update({
      where: { id: file.id },
      data: { avatarOwnerId: userId },
      select: avatarLocationSelect,
    });

    return {
      imageUrl: storedFilePath("AVATAR", next.key),
      previous: replaced,
    };
  }

  // A library Media or any other relative/absolute image address is a plain
  // column value, not a file this user owns. `/files/...` was handled above, so
  // this cannot claim someone else's attachment.
  const external =
    address?.area === "media" ||
    isAbsoluteHttpAddress(normalized) ||
    (normalized.startsWith("/") && !normalized.startsWith("//"));

  if (external) {
    await releaseAvatar(tx, previous);

    return { imageUrl: normalized, previous };
  }

  throw new AvatarFileError("A valid image address is required.");
}
