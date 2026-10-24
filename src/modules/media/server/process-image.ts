import "server-only";

import sharp from "sharp";

import {
  MEDIA_MAX_SOURCE_EDGE,
  MEDIA_RENDITION_QUALITY,
  MEDIA_RENDITION_WIDTHS,
} from "@/modules/media/lib/image-ladder.mjs";
import type {
  MediaMetadata,
  MediaRenditionFormat,
} from "@/modules/media/types";

import { blurDataUrl } from "./image-bytes";
import { mimeTypeForImageFormat } from "./inspect-image";

const RENDITION_FORMATS: readonly MediaRenditionFormat[] = ["avif", "webp"];

const NORMALISED_FORMATS = [
  "avif",
  "gif",
  "jpeg",
  "png",
  "tiff",
  "webp",
] as const;

type NormalisedFormat = (typeof NORMALISED_FORMATS)[number];

type SharpPipeline = ReturnType<typeof sharp>;

export interface NormalisedImage {
  bytes: Uint8Array<ArrayBuffer>;
  format: NormalisedFormat;
  mimeType: string;
  metadata: MediaMetadata & { width: number; height: number };
}

export interface GeneratedRendition {
  bytes: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
  format: MediaRenditionFormat;
}

function normalisedFormat(format: string | undefined): NormalisedFormat {
  const candidate = format?.toLowerCase();

  return NORMALISED_FORMATS.includes(candidate as NormalisedFormat)
    ? (candidate as NormalisedFormat)
    : "png";
}

function applyFormat(
  pipeline: SharpPipeline,
  format: NormalisedFormat,
  quality: Readonly<{ avif: number; webp: number }>,
): SharpPipeline {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({ quality: 82, mozjpeg: true });
    case "png":
      return pipeline.png({ compressionLevel: 9 });
    case "webp":
      return pipeline.webp({ quality: quality.webp });
    case "avif":
      return pipeline.avif({ quality: quality.avif });
    case "gif":
      return pipeline.gif();
    case "tiff":
      return pipeline.tiff({ compression: "lzw" });
  }
}

/**
 * Applies EXIF orientation, strips metadata and bounds the long edge. The
 * result is the single source every rendition is cut from, so the original and
 * its renditions can never disagree about orientation or size.
 */
export async function normaliseImage(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<NormalisedImage> {
  const source = sharp(bytes, { failOn: "none" });
  const info = await source.metadata();

  if (!info.format || !info.width || !info.height) {
    throw new Error("Unsupported or corrupt image");
  }

  const format = normalisedFormat(info.format);
  const pipeline = sharp(bytes, { failOn: "none" })
    .autoOrient()
    .resize({
      width: MEDIA_MAX_SOURCE_EDGE,
      height: MEDIA_MAX_SOURCE_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });
  const { data, info: output } = await applyFormat(
    pipeline,
    format,
    MEDIA_RENDITION_QUALITY,
  ).toBuffer({ resolveWithObject: true });

  const normalisedBytes = new Uint8Array(data);

  return {
    bytes: normalisedBytes,
    format,
    mimeType: mimeTypeForImageFormat(format),
    metadata: {
      width: output.width,
      height: output.height,
      ...(info.orientation !== undefined
        ? { orientation: info.orientation }
        : {}),
      blurDataURL: await blurDataUrl(normalisedBytes),
    },
  };
}

/**
 * Cuts the full ladder in both delivery formats. The ladder is fixed, so the
 * loader can ask for any width and always find an object.
 */
export async function generateRenditions(
  image: NormalisedImage,
): Promise<GeneratedRendition[]> {
  const quality = MEDIA_RENDITION_QUALITY;
  const renditions: GeneratedRendition[] = [];

  for (const width of MEDIA_RENDITION_WIDTHS) {
    for (const format of RENDITION_FORMATS) {
      const pipeline = sharp(image.bytes).resize({ width });
      const { data, info } = await (format === "avif"
        ? pipeline.avif({ quality: quality.avif })
        : pipeline.webp({ quality: quality.webp })
      ).toBuffer({ resolveWithObject: true });

      renditions.push({
        bytes: new Uint8Array(data),
        width: info.width,
        height: info.height,
        format,
      });
    }
  }

  return renditions;
}
