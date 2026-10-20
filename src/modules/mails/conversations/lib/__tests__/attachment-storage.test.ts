import { describe, expect, it, vi } from "vitest";
import type { UTApi } from "uploadthing/server";

import {
  createUploadThingStorage,
  uploadThingKeyFromUrl,
} from "../attachment-storage";

function makeUtapi(deleteFiles = vi.fn()) {
  return { deleteFiles } as unknown as UTApi;
}

describe("uploadThingKeyFromUrl", () => {
  it("reads the key from current and legacy UploadThing URLs", () => {
    expect(
      uploadThingKeyFromUrl("https://app-123.ufs.sh/f/key-1-file.pdf"),
    ).toBe("key-1-file.pdf");
    expect(uploadThingKeyFromUrl("https://utfs.io/f/key%202-file.pdf")).toBe(
      "key 2-file.pdf",
    );
  });

  it("ignores URLs that are not stored in UploadThing", () => {
    expect(uploadThingKeyFromUrl("https://example.com/files/report.pdf")).toBe(
      null,
    );
    expect(uploadThingKeyFromUrl("not a url")).toBe(null);
  });
});

describe("createUploadThingStorage", () => {
  it("deletes only UploadThing keys derived from the stored URLs", async () => {
    const deleteFiles = vi.fn(async () => ({
      success: true,
      deletedCount: 2,
    }));
    const storage = createUploadThingStorage(makeUtapi(deleteFiles));

    await storage.delete([
      "https://app-123.ufs.sh/f/key-1-file.pdf",
      "https://utfs.io/f/key%202-file.pdf",
      "https://example.com/files/report.pdf",
    ]);

    expect(deleteFiles).toHaveBeenCalledWith([
      "key-1-file.pdf",
      "key 2-file.pdf",
    ]);
  });

  it("does not call the provider when no attachment is stored there", async () => {
    const deleteFiles = vi.fn();
    const storage = createUploadThingStorage(makeUtapi(deleteFiles));

    await storage.delete(["https://example.com/files/report.pdf"]);

    expect(deleteFiles).not.toHaveBeenCalled();
  });
});
