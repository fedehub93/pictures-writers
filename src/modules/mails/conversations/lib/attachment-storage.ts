import "server-only";

import { randomUUID } from "node:crypto";
import { UTApi } from "uploadthing/server";

/**
 * Application storage seam for inbound email attachments. The provider hands
 * out signed URLs that expire, so attachments are copied into our own storage
 * and referenced by the resulting durable URL.
 */
export interface AttachmentStorage {
  store(params: {
    filename: string;
    contentType: string;
    sourceUrl: string;
  }): Promise<{ url: string }>;
}

/** Production implementation backed by UploadThing. */
export function createUploadThingStorage(utapi: UTApi = new UTApi()): AttachmentStorage {
  return {
    async store({ filename, sourceUrl }) {
      const result = await utapi.uploadFilesFromUrl({
        url: sourceUrl,
        name: `${randomUUID()}-${filename}`,
      });

      if (result.error || !result.data) {
        throw new Error(
          result.error?.message || "Impossible to store attachment",
        );
      }

      return { url: result.data.url };
    },
  };
}
