import { createHash } from "node:crypto";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { MEDIA_BLUR_WIDTH } from "@/modules/media/lib/image-ladder.mjs";

import { inspectImage } from "../inspect-image";

async function createPng(width = 96, height = 48): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 220, g: 30, b: 40 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

describe("inspectImage", () => {
  it("derives MIME type, byte size, dimensions, checksum and blur placeholder", async () => {
    const bytes = await createPng(96, 48);

    const inspected = await inspectImage(bytes);

    expect(inspected.mimeType).toBe("image/png");
    expect(inspected.size).toBe(bytes.byteLength);
    expect(inspected.metadata.width).toBe(96);
    expect(inspected.metadata.height).toBe(48);
    expect(inspected.checksum).toBe(
      createHash("sha256").update(bytes).digest("hex"),
    );
    expect(inspected.metadata.blurDataURL).toMatch(/^data:image\/webp;base64,/);
  });

  it("keeps the blur placeholder small enough to inline", async () => {
    const bytes = await createPng(1200, 800);

    const inspected = await inspectImage(bytes);
    const base64 = inspected.metadata.blurDataURL!.split(",")[1];

    const placeholder = await sharp(Buffer.from(base64, "base64")).metadata();

    expect(placeholder.width).toBeLessThanOrEqual(MEDIA_BLUR_WIDTH);
  });

  it("uses the EXIF-corrected dimensions", async () => {
    const buffer = await sharp({
      create: {
        width: 120,
        height: 60,
        channels: 3,
        background: { r: 10, g: 120, b: 220 },
      },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const inspected = await inspectImage(new Uint8Array(buffer));

    expect(inspected.metadata.orientation).toBe(6);
    expect(inspected.metadata.width).toBe(60);
    expect(inspected.metadata.height).toBe(120);
  });
});
