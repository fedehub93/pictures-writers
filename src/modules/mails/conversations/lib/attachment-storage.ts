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
    content: Uint8Array<ArrayBuffer>;
  }): Promise<{ url: string }>;
  /** Remove stored files. Callers treat failures as best-effort. */
  delete(urls: string[]): Promise<void>;
}

const UPLOADTHING_FILE_PATH = "/f/";

function isUploadThingHost(hostname: string): boolean {
  return (
    hostname === "utfs.io" ||
    hostname === "uploadthing.com" ||
    hostname.endsWith(".ufs.sh") ||
    hostname.endsWith(".uploadthing.com")
  );
}

/**
 * UploadThing URLs look like `https://<app>.ufs.sh/f/<key>`, while its delete
 * API expects the bare key. Foreign URLs are skipped so a deletion never
 * reaches a file we do not own.
 */
export function uploadThingKeyFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (!isUploadThingHost(url.hostname)) return null;
    if (!url.pathname.startsWith(UPLOADTHING_FILE_PATH)) return null;

    const key = decodeURIComponent(
      url.pathname.slice(UPLOADTHING_FILE_PATH.length),
    );
    return key || null;
  } catch {
    return null;
  }
}

/** Production implementation backed by UploadThing. */
export function createUploadThingStorage(utapi: UTApi = new UTApi()): AttachmentStorage {
  return {
    async store({ filename, contentType, content }) {
      const result = await utapi.uploadFiles(
        new File([content], `${randomUUID()}-${filename}`, {
          type: contentType,
        }),
      );

      if (result.error || !result.data) {
        throw new Error(
          result.error?.message || "Impossible to store attachment",
        );
      }

      return { url: result.data.url };
    },

    async delete(urls) {
      const keys = urls
        .map(uploadThingKeyFromUrl)
        .filter((key): key is string => key !== null);

      if (keys.length === 0) return;

      await utapi.deleteFiles(keys);
    },
  };
}
