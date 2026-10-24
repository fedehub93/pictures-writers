import type { MediaRendition, MediaRenditionFormat } from "../types";
import {
  isSafeRenditionUrl,
  parseSrc,
  serializeSrc,
} from "./url";

/**
 * The rendition manifest is not readable by the browser, so the delivery URL
 * carries the minimum information a pure, synchronous loader needs: the
 * revision, whether the Media is archived and the URLs of the generated
 * renditions. The original provider URL stays as the base of the delivery URL,
 * so the token is additive and the URL keeps working without it.
 */
export const MEDIA_MANIFEST_PARAM = "mt";

export interface MediaManifestRendition {
  url: string;
  width: number;
  format: MediaRenditionFormat;
}

export interface MediaManifest {
  version: 1;
  revision: number;
  archived: boolean;
  renditions: MediaManifestRendition[];
}

/**
 * The manifest persisted on the Media row stores the storage key; the
 * delivery token needs the resolved URL because the browser cannot call the
 * storage driver. The processor passes both when it writes the token.
 */
export type RenditionDeliveryInput = Pick<
  MediaRendition,
  "width" | "format"
> & { url: string };

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function isFormat(value: unknown): value is MediaRenditionFormat {
  return value === "avif" || value === "webp";
}

function isManifestRendition(value: unknown): value is MediaManifestRendition {
  if (typeof value !== "object" || value === null) return false;

  const rendition = value as Record<string, unknown>;

  return (
    typeof rendition.url === "string" &&
    isSafeRenditionUrl(rendition.url) &&
    typeof rendition.width === "number" &&
    Number.isFinite(rendition.width) &&
    rendition.width > 0 &&
    isFormat(rendition.format)
  );
}

export function encodeMediaManifest(manifest: MediaManifest): string {
  return toBase64Url(JSON.stringify(manifest));
}

export function decodeMediaManifest(
  token: string | null | undefined,
): MediaManifest | null {
  if (!token) return null;

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(token));
    if (typeof parsed !== "object" || parsed === null) return null;

    const value = parsed as Record<string, unknown>;
    if (value.version !== 1 || !Array.isArray(value.renditions)) return null;

    return {
      version: 1,
      revision:
        typeof value.revision === "number" && Number.isFinite(value.revision)
          ? value.revision
          : 1,
      archived: value.archived === true,
      renditions: value.renditions.filter(isManifestRendition),
    };
  } catch {
    return null;
  }
}

/**
 * Builds the value to put in `<Image src>` for a Media. Media without
 * renditions keeps its plain original URL (the loader falls back to it).
 */
export function buildMediaDeliveryUrl(
  originalUrl: string,
  input: {
    revision: number;
    archived: boolean;
    renditions: RenditionDeliveryInput[];
  },
): string {
  if (input.renditions.length === 0) return originalUrl;

  const { url, absolute } = parseSrc(originalUrl);
  url.searchParams.set(
    MEDIA_MANIFEST_PARAM,
    encodeMediaManifest({
      version: 1,
      revision: input.revision,
      archived: input.archived,
      renditions: input.renditions.map((rendition) => ({
        url: rendition.url,
        width: rendition.width,
        format: rendition.format,
      })),
    }),
  );

  return serializeSrc(url, absolute);
}

/**
 * Removes the delivery token, returning the original URL exactly as stored.
 */
export function stripMediaManifest(src: string): string {
  const { url, absolute } = parseSrc(src);
  const hadManifest = url.searchParams.has(MEDIA_MANIFEST_PARAM);

  url.searchParams.delete(MEDIA_MANIFEST_PARAM);

  if (!hadManifest) return src;

  const serialized = serializeSrc(url, absolute);

  return absolute ? serialized : serialized || "/";
}
