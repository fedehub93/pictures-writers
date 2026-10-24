import type { MediaMetadata } from "../types";

type WithMetadata = { metadata?: unknown } | null | undefined;

/**
 * Blur placeholders are only applied where an image is cover/hero-sized: the
 * rest of the interface has no room for them and would pay bytes for nothing.
 */
export function getMediaBlurDataURL(media: WithMetadata): string | null {
  if (!media || typeof media.metadata !== "object" || media.metadata === null) {
    return null;
  }

  const { blurDataURL } = media.metadata as Partial<MediaMetadata>;

  return typeof blurDataURL === "string" && blurDataURL.startsWith("data:")
    ? blurDataURL
    : null;
}
