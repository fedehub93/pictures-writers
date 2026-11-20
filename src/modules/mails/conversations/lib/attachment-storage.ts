import "server-only";

import { StoredFileKind } from "@/generated/prisma";

import { storeOwnedFile } from "@/modules/media/server/owned-file";

/**
 * Application storage seam for inbound email attachments. The provider hands
 * out signed URLs that expire, so attachments are copied through the active
 * driver and referenced by the record the write creates.
 */
export interface AttachmentStorage {
  store(params: {
    filename: string;
    contentType: string;
    content: Uint8Array<ArrayBuffer>;
  }): Promise<{ storedFileId: string }>;
}

/** Production implementation: the same transport as every owned file. */
export function createOwnedAttachmentStorage(): AttachmentStorage {
  return {
    async store({ filename, contentType, content }) {
      const stored = await storeOwnedFile({
        kind: StoredFileKind.ATTACHMENT,
        filename,
        contentType,
        bytes: content,
      });

      return { storedFileId: stored.id };
    },
  };
}
