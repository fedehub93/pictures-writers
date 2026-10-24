/**
 * Single source of truth for the image width ladder.
 *
 * Next.js reads these values to decide which widths it asks the custom loader
 * for, and the media processor reads the same values to decide which
 * renditions to generate. They must never drift: the loader can only return a
 * rendition that exists.
 *
 * This file is plain ESM so `next.config.mjs` can import it without a build
 * step. The JSDoc annotations give TypeScript the literal types.
 */

/** @type {readonly [128, 256]} */
export const MEDIA_IMAGE_SIZES = Object.freeze([128, 256]);

/** @type {readonly [360, 480, 720, 960, 1440, 1920]} */
export const MEDIA_DEVICE_SIZES = Object.freeze([360, 480, 720, 960, 1440, 1920]);

/** @type {readonly [128, 256, 360, 480, 720, 960, 1440, 1920]} */
export const MEDIA_RENDITION_WIDTHS = Object.freeze([
  ...MEDIA_IMAGE_SIZES,
  ...MEDIA_DEVICE_SIZES,
]);

/** Quality values components may pass to `next/image` (the value is baked into renditions). */
/** @type {readonly [75]} */
export const MEDIA_IMAGE_QUALITIES = Object.freeze([75]);

export const MEDIA_IMAGE_DEFAULT_QUALITY = 75;

/** Encoder quality per rendition format. */
/** @type {Readonly<{ avif: 50, webp: 75 }>} */
export const MEDIA_RENDITION_QUALITY = Object.freeze({ avif: 50, webp: 75 });

/**
 * Named roles the interface uses. The union of every profile is the rendition
 * ladder; profiles are code in v1, configuration later.
 *
 * @type {Readonly<{
 *   thumb: readonly [128, 256],
 *   card: readonly [256, 360, 480, 720],
 *   cover: readonly [720, 960, 1440, 1920],
 *   og: readonly [1440, 1920]
 * }>}
 */
export const MEDIA_PROFILES = Object.freeze({
  thumb: Object.freeze([128, 256]),
  card: Object.freeze([256, 360, 480, 720]),
  cover: Object.freeze([720, 960, 1440, 1920]),
  og: Object.freeze([1440, 1920]),
});

/** Long edge every uploaded image is normalised to before renditions are cut. */
export const MEDIA_MAX_SOURCE_EDGE = 1920;

/** Width of the generated blur placeholder. */
export const MEDIA_BLUR_WIDTH = 20;

/** UploadThing CDN origin used to resolve legacy `/assets/<id>` URLs. */
export const UPLOADTHING_FILE_ORIGIN = "https://ghhc7ejbae.ufs.sh";

export const UPLOADTHING_FILE_PATH = "/f/";

export const LEGACY_ASSET_PREFIX = "/assets/";
