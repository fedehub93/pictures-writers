import "server-only";

import { StorageObjectNotFoundError, type StorageDriver } from "./types";

export interface UploadThingUploadFile extends Blob {
  name: string;
  customId?: string | null;
}

export type UploadThingUploadResult =
  | {
      data: { key: string; url: string; ufsUrl: string };
      error: null;
    }
  | {
      data: null;
      error: { message: string };
    };

export interface UploadThingApi {
  uploadFiles(file: UploadThingUploadFile): Promise<UploadThingUploadResult>;
  deleteFiles(
    keys: string[],
    opts?: { keyType?: "fileKey" | "customId" },
  ): Promise<{ success: boolean; deletedCount: number }>;
  getFileUrls(
    keys: string[],
    opts?: { keyType?: "fileKey" | "customId" },
  ): Promise<{ data: readonly { key: string; url: string }[] }>;
  listFiles(opts?: { limit?: number; offset?: number }): Promise<{
    files: readonly { key: string; customId: string | null }[];
    hasMore: boolean;
  }>;
}

function fileNameForKey(key: string): string {
  return key.split("/").pop() || "file";
}

export function createUploadThingStorageDriver(
  api: UploadThingApi,
  fetchImpl: typeof fetch = fetch,
): StorageDriver {
  async function urlFor(key: string): Promise<string | null> {
    const { data } = await api.getFileUrls([key], { keyType: "customId" });
    return data[0]?.url ?? null;
  }

  return {
    async put(key, bytes, contentType) {
      await api.deleteFiles([key], { keyType: "customId" });

      const file = Object.assign(
        new File([bytes], fileNameForKey(key), { type: contentType }),
        { customId: key },
      );
      const result = await api.uploadFiles(file);

      if (result.error || !result.data) {
        throw new Error(
          result.error?.message ?? `Unable to write storage object "${key}"`,
        );
      }
    },

    async get(key) {
      const url = await urlFor(key);
      if (!url) throw new StorageObjectNotFoundError(key);

      const response = await fetchImpl(url);
      if (response.status === 404) throw new StorageObjectNotFoundError(key);
      if (!response.ok) {
        throw new Error(`Unable to read storage object "${key}"`);
      }

      return new Uint8Array(await response.arrayBuffer());
    },

    async delete(key) {
      const result = await api.deleteFiles([key], { keyType: "customId" });

      if (!result.success) {
        throw new Error(`Unable to delete storage object "${key}"`);
      }
      if (result.deletedCount === 0) throw new StorageObjectNotFoundError(key);
    },

    async deletePrefix(prefix) {
      const customIds: string[] = [];
      let offset = 0;

      while (true) {
        const page = await api.listFiles({ limit: 500, offset });
        for (const file of page.files) {
          if (file.customId?.startsWith(prefix)) {
            customIds.push(file.customId);
          }
        }

        if (!page.hasMore || page.files.length === 0) break;
        offset += page.files.length;
      }

      let deleted = 0;
      for (let index = 0; index < customIds.length; index += 100) {
        const result = await api.deleteFiles(customIds.slice(index, index + 100), {
          keyType: "customId",
        });

        if (!result.success) {
          throw new Error(`Unable to delete storage prefix "${prefix}"`);
        }
        deleted += result.deletedCount;
      }

      return deleted;
    },

    async url(key) {
      const url = await urlFor(key);
      if (!url) throw new StorageObjectNotFoundError(key);
      return url;
    },
  };
}
