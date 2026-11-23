import "server-only";

import sharp from "sharp";

/**
 * A difference hash: a 9x8 greyscale grid, one bit per horizontal neighbour
 * comparison. The picture is stretched to that grid, so the hash is invariant
 * to scale, but a crop or a rotation changes it, which is what makes it a
 * sensible "same picture" test and a poor "similar picture" one.
 *
 * Sixty-four bits cannot tell a re-encoded copy from the original reliably at
 * distance zero — the encoder's block arithmetic moves a few edges — so a
 * small distance is the match. The bytes are packed most-significant bit first.
 */
export const PERCEPTUAL_HASH_WIDTH = 9;
export const PERCEPTUAL_HASH_HEIGHT = 8;
export const PERCEPTUAL_HASH_BYTES = 8;

/**
 * The bits two copies of the same picture may differ by. Measured on the
 * provider's pre-normalisation sources against the library's normalised copies:
 * a re-encode moves a handful of edges, a different picture of the same subject
 * moves tens of them. Six of sixty-four is deliberately tight.
 */
export const PERCEPTUAL_MATCH_DISTANCE = 6;

/**
 * The perceptual hash of an image, or `null` when the bytes are not an image
 * this build can decode. Never throws: a source that cannot be read is not a
 * match, not a failure of the run.
 */
export async function perceptualHashOf(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array | null> {
  try {
    const { data } = await sharp(bytes, { failOn: "none" })
      .autoOrient()
      .greyscale()
      .resize({
        width: PERCEPTUAL_HASH_WIDTH,
        height: PERCEPTUAL_HASH_HEIGHT,
        fit: "fill",
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const expected = PERCEPTUAL_HASH_WIDTH * PERCEPTUAL_HASH_HEIGHT;
    if (data.length < expected) return null;

    const hash = new Uint8Array(PERCEPTUAL_HASH_BYTES);
    let bit = 0;

    for (let y = 0; y < PERCEPTUAL_HASH_HEIGHT; y += 1) {
      const row = y * PERCEPTUAL_HASH_WIDTH;

      for (let x = 0; x < PERCEPTUAL_HASH_WIDTH - 1; x += 1) {
        const left = data[row + x]!;
        const right = data[row + x + 1]!;

        if (right > left) {
          hash[bit >> 3] |= 1 << (7 - (bit & 7));
        }

        bit += 1;
      }
    }

    return hash;
  } catch {
    return null;
  }
}

/** How many bits two hashes differ by. */
export function perceptualDistance(left: Uint8Array, right: Uint8Array): number {
  const length = Math.min(left.length, right.length);
  let distance = 0;

  for (let index = 0; index < length; index += 1) {
    let difference = left[index]! ^ right[index]!;

    while (difference !== 0) {
      distance += difference & 1;
      difference >>= 1;
    }
  }

  return distance;
}
