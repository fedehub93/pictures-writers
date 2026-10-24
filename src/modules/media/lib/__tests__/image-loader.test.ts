import { describe, expect, it } from "vitest";

import {
  MEDIA_DEVICE_SIZES,
  MEDIA_IMAGE_SIZES,
  MEDIA_PROFILES,
  MEDIA_RENDITION_WIDTHS,
  UPLOADTHING_FILE_ORIGIN,
  UPLOADTHING_FILE_PATH,
} from "../image-ladder.mjs";
import { resolveMediaImageSource } from "../image-loader";
import {
  buildMediaDeliveryUrl,
  encodeMediaManifest,
  withMediaDeliveryArchived,
} from "../manifest";
import type { MediaRendition } from "../../types";

type DeliveredRendition = MediaRendition & { url: string };

const ORIGINAL = "https://ghhc7ejbae.ufs.sh/f/abc123";

function rendition(width: number): DeliveredRendition {
  return {
    key: `media-1/1/${width}.avif`,
    url: `https://ghhc7ejbae.ufs.sh/f/rendition-${width}`,
    width,
    height: Math.round((width * 9) / 16),
    bytes: 1000 + width,
    format: "avif",
  };
}

function webpRendition(width: number): DeliveredRendition {
  return {
    ...rendition(width),
    key: `media-1/1/${width}.webp`,
    url: `https://ghhc7ejbae.ufs.sh/f/webp-${width}`,
    format: "webp",
  };
}

function srcWithRenditions(
  renditions: DeliveredRendition[],
  options: { archived?: boolean; revision?: number } = {},
): string {
  return buildMediaDeliveryUrl(ORIGINAL, {
    revision: options.revision ?? 1,
    archived: options.archived ?? false,
    renditions,
  });
}

describe("image ladder", () => {
  it("requests only widths that are generated", () => {
    expect([...MEDIA_RENDITION_WIDTHS]).toEqual(
      [...MEDIA_IMAGE_SIZES, ...MEDIA_DEVICE_SIZES].sort((a, b) => a - b),
    );
  });

  it("builds every profile from ladder widths", () => {
    for (const widths of Object.values(MEDIA_PROFILES)) {
      for (const width of widths) {
        expect(MEDIA_RENDITION_WIDTHS).toContain(width);
      }
    }
  });
});

describe("resolveMediaImageSource", () => {
  it("serves an original Media before any rendition exists", () => {
    expect(resolveMediaImageSource(ORIGINAL, 960)).toBe(ORIGINAL);
  });

  it("returns the rendition at the requested width", () => {
    const src = srcWithRenditions([rendition(360), rendition(960), rendition(1920)]);

    expect(resolveMediaImageSource(src, 960)).toBe(rendition(960).url);
  });

  it("rounds down to the nearest generated width", () => {
    const src = srcWithRenditions([rendition(360), rendition(720), rendition(960)]);

    expect(resolveMediaImageSource(src, 900)).toBe(rendition(720).url);
  });

  it("never returns a rendition wider than the request", () => {
    const src = srcWithRenditions([rendition(360), rendition(720)]);

    expect(resolveMediaImageSource(src, 500)).toBe(rendition(360).url);
  });

  it("prefers AVIF at the same width", () => {
    const src = srcWithRenditions([webpRendition(960), rendition(960)]);

    expect(resolveMediaImageSource(src, 960)).toBe(rendition(960).url);
  });

  it("falls back to WebP when AVIF is missing", () => {
    const src = srcWithRenditions([webpRendition(960)]);

    expect(resolveMediaImageSource(src, 960)).toBe(webpRendition(960).url);
  });

  it("falls back to the original when the request is below the smallest rendition", () => {
    const src = srcWithRenditions([rendition(360)]);

    expect(resolveMediaImageSource(src, 100)).toBe(ORIGINAL);
  });

  it("serves the original for an archived Media", () => {
    const src = srcWithRenditions([rendition(960)], { archived: true });

    expect(resolveMediaImageSource(src, 960)).toBe(ORIGINAL);
  });

  it("passes external URLs through unchanged", () => {
    const src = "https://images.example.com/avatar.jpg?width=100";

    expect(resolveMediaImageSource(src, 960)).toBe(src);
  });

  it("passes SVGs through unchanged", () => {
    const src = "https://example.com/logo.svg";

    expect(resolveMediaImageSource(src, 960)).toBe(src);
  });

  it("passes data URIs through unchanged", () => {
    const src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==";

    expect(resolveMediaImageSource(src, 960)).toBe(src);
  });

  it("passes local static files through unchanged", () => {
    expect(resolveMediaImageSource("/images/hero.jpg", 960)).toBe(
      "/images/hero.jpg",
    );
  });

  it("resolves legacy relative /assets URLs to the provider original", () => {
    expect(resolveMediaImageSource("/assets/legacy-id", 960)).toBe(
      `${UPLOADTHING_FILE_ORIGIN}${UPLOADTHING_FILE_PATH}legacy-id`,
    );
  });

  it("resolves legacy absolute /assets URLs to the provider original", () => {
    expect(
      resolveMediaImageSource("https://pictureswriters.com/assets/legacy-id", 960),
    ).toBe(`${UPLOADTHING_FILE_ORIGIN}${UPLOADTHING_FILE_PATH}legacy-id`);
  });

  it("ignores a malformed delivery token and falls back to the original", () => {
    const src = `${ORIGINAL}?mt=not-valid-base64`;

    expect(resolveMediaImageSource(src, 960)).toBe(ORIGINAL);
  });

  it("refuses a delivery token that points at a non-fetchable scheme", () => {
    const token = encodeMediaManifest({
      version: 1,
      revision: 1,
      archived: false,
      renditions: [
        {
          url: "javascript:alert(1)",
          width: 960,
          format: "avif",
        },
      ],
    });
    const src = `${ORIGINAL}?mt=${token}`;

    expect(resolveMediaImageSource(src, 960)).toBe(ORIGINAL);
  });

  it("resolves a rendition carried by a local-driver delivery URL", () => {
    const src = buildMediaDeliveryUrl("/media/media-1/1/original", {
      revision: 1,
      archived: false,
      renditions: [
        {
          url: "/media/media-1/1/960.avif",
          width: 960,
          format: "avif",
        },
      ],
    });

    expect(resolveMediaImageSource(src, 960)).toBe("/media/media-1/1/960.avif");
    expect(resolveMediaImageSource(src, 100)).toBe(
      "/media/media-1/1/original",
    );
  });

  it("passes an external URL carrying a stray delivery token through unchanged", () => {
    const external = "https://images.example.com/avatar.jpg";
    const src = buildMediaDeliveryUrl(external, {
      revision: 1,
      archived: false,
      renditions: [
        {
          url: "https://images.example.com/rendition.jpg",
          width: 960,
          format: "avif",
        },
      ],
    });

    expect(resolveMediaImageSource(src, 960)).toBe(src);
  });

  it("never requests a width outside the configured ladder", () => {
    const everyWidth = MEDIA_RENDITION_WIDTHS.map((width) => rendition(width));
    const src = srcWithRenditions(everyWidth);

    for (const width of MEDIA_RENDITION_WIDTHS) {
      const resolved = resolveMediaImageSource(src, width);
      const resolvedWidth = everyWidth.find(
        (candidate) => candidate.url === resolved,
      )?.width;

      expect(resolvedWidth).toBe(width);
    }
  });

  it("returns a decodable manifest token on the delivery URL", () => {
    const src = srcWithRenditions([rendition(960)], { revision: 3 });
    const token = new URL(src).searchParams.get("mt");

    expect(token).toBe(
      encodeMediaManifest({
        version: 1,
        revision: 3,
        archived: false,
        renditions: [{ url: rendition(960).url, width: 960, format: "avif" }],
      }),
    );
  });

  it("switches an existing delivery URL to the original when archived", () => {
    const src = srcWithRenditions([rendition(960)]);

    const archived = withMediaDeliveryArchived(src, true);

    expect(resolveMediaImageSource(archived, 960)).toBe(ORIGINAL);

    const restored = withMediaDeliveryArchived(archived, false);

    expect(resolveMediaImageSource(restored, 960)).toBe(rendition(960).url);
  });

  it("leaves a URL without a delivery token unchanged when archiving", () => {
    expect(withMediaDeliveryArchived(ORIGINAL, true)).toBe(ORIGINAL);
  });
});
