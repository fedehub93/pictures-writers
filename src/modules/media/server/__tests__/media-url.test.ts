import { describe, expect, it } from "vitest";

import { absoluteMediaUrl, isOwnMediaUrl } from "../media-url";

const SITE = "https://example.test";

describe("isOwnMediaUrl", () => {
  it("treats a relative address as this Installation's", () => {
    expect(isOwnMediaUrl("/media/default/abc/1/original", SITE)).toBe(true);
  });

  it("compares an absolute address against the canonical URL", () => {
    expect(
      isOwnMediaUrl("https://example.test/media/default/abc/1/original", SITE),
    ).toBe(true);
    expect(isOwnMediaUrl("https://other.test/media/cover.jpg", SITE)).toBe(
      false,
    );
    expect(isOwnMediaUrl("https://fake-app.ufs.sh/f/abc", SITE)).toBe(false);
  });
});

describe("absoluteMediaUrl", () => {
  it("prefixes the canonical URL to a relative media address", () => {
    expect(absoluteMediaUrl("/media/default/abc/1/original", SITE)).toBe(
      "https://example.test/media/default/abc/1/original",
    );
  });

  it("prefixes the canonical URL to a legacy /assets address", () => {
    expect(absoluteMediaUrl("/assets/legacy-id", SITE)).toBe(
      "https://example.test/assets/legacy-id",
    );
  });

  it("leaves an already absolute own-host address untouched", () => {
    const src = "https://example.test/media/default/abc/1/original";

    expect(absoluteMediaUrl(src, SITE)).toBe(src);
  });

  it("leaves a provider URL untouched, because it answers directly", () => {
    const src = "https://fake-app.ufs.sh/f/abc";

    expect(absoluteMediaUrl(src, SITE)).toBe(src);
  });

  it("returns the stored address when no canonical URL is configured", () => {
    expect(absoluteMediaUrl("/media/default/abc/1/original", null)).toBe(
      "/media/default/abc/1/original",
    );
  });
});
