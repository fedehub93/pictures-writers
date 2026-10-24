import type {
  UploadThingApi,
  UploadThingUploadResult,
} from "../uploadthing";

interface StoredFile {
  customId: string;
  key: string;
  bytes: Uint8Array<ArrayBuffer>;
  contentType: string;
}

const UFS_URL = "https://fake-app.ufs.sh/f/";

function uploadResult(file: StoredFile): UploadThingUploadResult {
  const url = `${UFS_URL}${encodeURIComponent(file.key)}`;

  return {
    data: {
      key: file.key,
      url,
      ufsUrl: url,
    },
    error: null,
  };
}

function requireCustomIdKeys(opts?: {
  keyType?: "fileKey" | "customId";
}): void {
  if (opts?.keyType !== "customId") {
    throw new Error("The storage driver must address UploadThing by customId");
  }
}

export function createFakeUploadThingApi() {
  const files = new Map<string, StoredFile>();

  const api: UploadThingApi = {
    async uploadFiles(file) {
      const customId = file.customId;
      if (!customId) throw new Error("Test uploads require a customId");

      const stored: StoredFile = {
        customId,
        key: `file-${customId}`,
        bytes: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type,
      };
      files.set(customId, stored);

      return uploadResult(stored);
    },

    async deleteFiles(keys, opts) {
      requireCustomIdKeys(opts);

      let deletedCount = 0;
      for (const key of keys) {
        if (files.delete(key)) deletedCount += 1;
      }
      return { success: true, deletedCount };
    },

    async getFileUrls(keys, opts) {
      if (opts?.keyType === "fileKey") {
        return {
          data: keys.flatMap((key) => {
            const file = [...files.values()].find(
              (candidate) => candidate.key === key,
            );
            if (!file) return [];
            return [
              { key: file.key, url: `${UFS_URL}${encodeURIComponent(file.key)}` },
            ];
          }),
        };
      }

      requireCustomIdKeys(opts);

      return {
        data: keys.flatMap((customId) => {
          const file = files.get(customId);
          if (!file) return [];
          return [{ key: file.key, url: `${UFS_URL}${encodeURIComponent(file.key)}` }];
        }),
      };
    },

    async listFiles({ limit = 100, offset = 0 } = {}) {
      const all = [...files.values()];
      const page = all.slice(offset, offset + limit);

      return {
        files: page.map((file) => ({
          key: file.key,
          customId: file.customId,
        })),
        hasMore: offset + page.length < all.length,
      };
    },
  };

  return {
    api,
    fetch: async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const key = decodeURIComponent(new URL(url).pathname.slice("/f/".length));
      const file = [...files.values()].find((candidate) => candidate.key === key);

      if (!file) return new Response(null, { status: 404 });
      return new Response(file.bytes, { headers: { "content-type": file.contentType } });
    },
  };
}
