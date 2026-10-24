"use client";

import {
  LEGACY_ASSET_PREFIX,
  UPLOADTHING_FILE_ORIGIN,
  UPLOADTHING_FILE_PATH,
} from "./image-ladder.mjs";
import {
  MEDIA_MANIFEST_PARAM,
  decodeMediaManifest,
  stripMediaManifest,
  type MediaManifestRendition,
} from "./manifest";
import {
  isPicturesWritersUrl,
  isUploadThingUrl,
  parseSrc,
  serializeSrc,
} from "./url";

export interface MediaImageLoaderProps {
  src: string;
  width: number;
  quality?: number | string;
}

function isPassthrough(src: string): boolean {
  return (
    src.length === 0 ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("#") ||
    /\.svg(?:[?#]|$)/i.test(src)
  );
}

function legacyAssetOriginal(url: URL): string {
  const key = url.pathname.slice(LEGACY_ASSET_PREFIX.length);

  return `${UPLOADTHING_FILE_ORIGIN}${UPLOADTHING_FILE_PATH}${key}`;
}

function isManaged(url: URL, absolute: boolean): boolean {
  if (url.pathname.startsWith(LEGACY_ASSET_PREFIX)) {
    return !absolute || isPicturesWritersUrl(url);
  }

  return absolute && isUploadThingUrl(url);
}

function pickRendition(
  renditions: MediaManifestRendition[],
  width: number,
): MediaManifestRendition | null {
  const fitting = renditions.filter(
    (rendition) => rendition.width <= width,
  );

  if (fitting.length === 0) return null;

  const bestWidth = Math.max(...fitting.map((rendition) => rendition.width));
  const atWidth = fitting.filter((rendition) => rendition.width === bestWidth);

  return (
    atWidth.find((rendition) => rendition.format === "avif") ??
    atWidth.find((rendition) => rendition.format === "webp") ??
    atWidth[0] ??
    null
  );
}

/**
 * Pure resolution of a `next/image` source. It never performs I/O: a Media
 * without a rendition manifest (every legacy image until its renditions are
 * generated) resolves to its original URL.
 */
export function resolveMediaImageSource(src: string, width: number): string {
  if (isPassthrough(src)) return src;

  const { url, absolute } = parseSrc(src);
  const manifest = decodeMediaManifest(
    url.searchParams.get(MEDIA_MANIFEST_PARAM),
  );

  // A delivery token is self-describing and carries only validated URLs. It is
  // trusted for a managed provider URL or a relative (local driver) URL, never
  // for a third-party host, whose images must pass through untouched.
  const isRelativeDelivery = !absolute && manifest !== null;
  if (!isManaged(url, absolute) && !isRelativeDelivery) return src;

  const originalUrl = url.pathname.startsWith(LEGACY_ASSET_PREFIX)
    ? legacyAssetOriginal(url)
    : stripMediaManifest(serializeSrc(url, absolute));

  if (!manifest || manifest.archived) return originalUrl;

  const rendition = pickRendition(manifest.renditions, width);
  if (!rendition) return originalUrl;

  return rendition.url;
}

export default function mediaImageLoader({
  src,
  width,
}: MediaImageLoaderProps): string {
  return resolveMediaImageSource(src, width);
}
