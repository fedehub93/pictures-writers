import { describe, expect, it } from "vitest";

import {
  buildStoredAddressIndex,
  canonicalMediaAddress,
  rewriteAddressesInString,
} from "../address-rewrite";

const PROVIDER = "https://fake-app.ufs.sh/f/";

function providerUrl(key: string): string {
  return `${PROVIDER}${key}`;
}

describe("canonicalMediaAddress", () => {
  it("names each rendition by the Installation's own address", () => {
    const address = canonicalMediaAddress("default/media-1/1/original", {
      revision: 1,
      archived: false,
      renditions: [
        {
          key: "default/media-1/1/720.webp",
          width: 720,
          height: 480,
          bytes: 400,
          format: "webp",
          url: "https://fake-app.ufs.sh/f/default/media-1/1/720.webp",
        },
      ],
    });

    expect(address).toMatch(
      /^\/media\/default\/media-1\/1\/original\?mt=/,
    );
    expect(address).not.toContain("ufs.sh");
  });

  it("leaves out a rendition the original key cannot own", () => {
    const address = canonicalMediaAddress("legacy-flat-key", {
      revision: 1,
      archived: false,
      renditions: [
        {
          key: "media-1/1/720.webp",
          width: 720,
          height: 480,
          bytes: 400,
          format: "webp",
          url: "https://fake-app.ufs.sh/f/media-1/1/720.webp",
        },
      ],
    });

    expect(address).toBe("/media/legacy-flat-key");
  });

  it("includes renditions for a legacy three-segment key", () => {
    const address = canonicalMediaAddress("media-1/1/original", {
      revision: 1,
      archived: false,
      renditions: [
        {
          key: "media-1/1/720.webp",
          width: 720,
          height: 480,
          bytes: 400,
          format: "webp",
          url: "https://fake-app.ufs.sh/f/media-1/1/720.webp",
        },
      ],
    });

    expect(address).toMatch(/^\/media\/media-1\/1\/original\?mt=/);
    expect(address).not.toContain("ufs.sh");
  });
});

describe("rewriteAddressesInString", () => {
  const index = buildStoredAddressIndex([
    {
      fileId: "file-1",
      key: "default/media-1/1/original",
      role: "MEDIA",
      remoteUrl: providerUrl("default/media-1/1/original"),
      media: {
        revision: 1,
        archived: false,
        renditions: [],
      },
    },
  ]);

  it("rewrites a provider address and leaves an external link alone", () => {
    const result = rewriteAddressesInString(
      `<img src="${providerUrl("default/media-1/1/original")}"><a href="https://example.com/about">About</a>`,
      index,
    );

    expect(result.value).toBe(
      '<img src="/media/default/media-1/1/original"><a href="https://example.com/about">About</a>',
    );
    expect(result.rewritten).toBe(1);
    expect(result.unresolved).toBe(0);
    expect(result.fileIds).toEqual(["file-1"]);
  });

  it("leaves a canonical address alone and reports an unknown one", () => {
    const result = rewriteAddressesInString(
      `/media/default/media-1/1/original and ${providerUrl("missing-key")}`,
      index,
    );

    expect(result.value).toBe(
      `/media/default/media-1/1/original and ${providerUrl("missing-key")}`,
    );
    expect(result.rewritten).toBe(0);
    expect(result.unresolved).toBe(1);
  });

  it("rewrites the address each rendition was written with", () => {
    const renditionProviderUrl = providerUrl("opaque-provider-id");
    const renditionIndex = buildStoredAddressIndex([
      {
        fileId: "file-1",
        key: "default/media-1/1/original",
        role: "MEDIA",
        remoteUrl: providerUrl("default/media-1/1/original"),
        media: {
          revision: 1,
          archived: false,
          renditions: [
            {
              key: "default/media-1/1/720.webp",
              width: 720,
              height: 480,
              bytes: 400,
              format: "webp",
              url: renditionProviderUrl,
            },
          ],
        },
      },
    ]);

    const result = rewriteAddressesInString(
      `<img src="${providerUrl("default/media-1/1/original")}" srcset="${renditionProviderUrl} 720w">`,
      renditionIndex,
    );

    // The rendition keeps its own address: content asked for that width and
    // format, and the Media's address would answer with neither.
    expect(result.value).toContain('src="/media/default/media-1/1/original?mt=');
    expect(result.value).toContain(
      'srcset="/media/default/media-1/1/720.webp 720w"',
    );
    expect(result.value).not.toContain("fake-app.ufs.sh");
    expect(result.rewritten).toBe(2);
    expect(result.unresolved).toBe(0);
    expect(result.fileIds).toEqual(["file-1", "file-1"]);

    const second = rewriteAddressesInString(
      result.value as string,
      renditionIndex,
    );

    expect(second).toMatchObject({ rewritten: 0, unresolved: 0 });
    expect(second.value).toBe(result.value);
  });

  it("rewrites the legacy /assets/ shape and a flat key", () => {
    const legacyIndex = buildStoredAddressIndex([
      {
        fileId: "file-flat",
        key: "flat-provider-key",
        role: "MEDIA",
        remoteUrl: providerUrl("flat-provider-key"),
        media: {
          revision: 1,
          archived: false,
          renditions: [],
        },
      },
    ]);

    const result = rewriteAddressesInString(
      "/assets/flat-provider-key",
      legacyIndex,
    );

    expect(result.value).toBe("/media/flat-provider-key");
    expect(result.rewritten).toBe(1);
    expect(result.unresolved).toBe(0);
  });
});
