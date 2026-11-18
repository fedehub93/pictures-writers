import "server-only";

import { parseSrc, serializeSrc } from "@/modules/media/lib/url";

/**
 * Whether an address belongs to this Installation rather than to a provider.
 *
 * Relative addresses are on this Installation by definition. Absolute ones are
 * compared against the canonical URL, which only the server knows, so the check
 * lives here and never in the pure image loader.
 */
export function isOwnMediaUrl(src: string, siteUrl: string): boolean {
  const { url, absolute } = parseSrc(src);
  if (!absolute) return true;

  try {
    return url.origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}

/**
 * Absolute form of a stored Media address, for boundaries a browser does not
 * resolve: social metadata, JSON-LD, sitemap, email HTML and checkout. A
 * provider URL already answers directly and is returned untouched.
 *
 * Without a canonical URL there is nothing to compose, so the address is
 * returned exactly as stored: the caller can still emit a provider URL, and a
 * relative one is a configuration bug rather than something invented here.
 */
export function absoluteMediaUrl(
  src: string,
  siteUrl: string | null | undefined,
): string {
  if (!siteUrl || !isOwnMediaUrl(src, siteUrl)) return src;

  const { url, absolute } = parseSrc(src);
  if (absolute) return src;

  const base = siteUrl.replace(/\/+$/, "");
  return `${base}${serializeSrc(url, false)}`;
}
