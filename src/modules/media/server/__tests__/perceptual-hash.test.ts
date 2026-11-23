import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  perceptualDistance,
  perceptualHashOf,
  PERCEPTUAL_HASH_BYTES,
  PERCEPTUAL_MATCH_DISTANCE,
} from "../perceptual-hash";

function pattern(width = 96, height = 72): Promise<Uint8Array<ArrayBuffer>> {
  const raw = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      raw[offset] = (x * 3) % 256;
      raw[offset + 1] = (y * 4) % 256;
      raw[offset + 2] = (x * y) % 256;
    }
  }

  return sharp(raw, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer()
    .then((buffer) => new Uint8Array(buffer));
}

function otherPicture(): Promise<Uint8Array<ArrayBuffer>> {
  return sharp({
    create: {
      width: 96,
      height: 72,
      channels: 3,
      background: { r: 240, g: 240, b: 240 },
    },
  })
    .png()
    .toBuffer()
    .then((buffer) => new Uint8Array(buffer));
}

describe("perceptualHashOf", () => {
  it("returns sixty-four bits for an image", async () => {
    const hash = await perceptualHashOf(await pattern());

    expect(hash).not.toBeNull();
    expect(hash!.length).toBe(PERCEPTUAL_HASH_BYTES);
  });

  it("keeps an identical copy at distance zero", async () => {
    const bytes = await pattern();
    const left = await perceptualHashOf(bytes);
    const right = await perceptualHashOf(bytes);

    expect(perceptualDistance(left!, right!)).toBe(0);
  });

  it("keeps a re-encoded copy within the match distance", async () => {
    const original = await pattern();
    const reencoded = new Uint8Array(
      await sharp(original).jpeg({ quality: 55 }).toBuffer(),
    );

    const left = await perceptualHashOf(original);
    const right = await perceptualHashOf(reencoded);

    expect(perceptualDistance(left!, right!)).toBeLessThanOrEqual(
      PERCEPTUAL_MATCH_DISTANCE,
    );
  });

  it("separates a different picture", async () => {
    const left = await perceptualHashOf(await pattern());
    const right = await perceptualHashOf(await otherPicture());

    expect(perceptualDistance(left!, right!)).toBeGreaterThan(
      PERCEPTUAL_MATCH_DISTANCE,
    );
  });

  it("returns null for bytes that are not an image", async () => {
    expect(await perceptualHashOf(new Uint8Array(64))).toBeNull();
  });
});
