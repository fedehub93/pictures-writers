import { MEDIA_PATH_PREFIX } from "./image-ladder.mjs";

/**
 * The two public prefixes of a stored file, both on the Installation's own
 * domain. The prefix conveys the role, never the driver, so a move never
 * changes an address.
 */
export const FILES_PATH_PREFIX = "/files";

export type StoredFileRole = "MEDIA" | "ATTACHMENT" | "AVATAR";
export type StoredFileAddressArea = "media" | "files";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function pathnameOf(src: string): string | null {
  try {
    return new URL(src).pathname;
  } catch {
    if (!src.startsWith("/")) return null;

    const [pathname] = src.split(/[?#]/, 1);
    return pathname ?? null;
  }
}

/**
 * The canonical, driver-independent address of a stored file. One composer for
 * every role: library Media answer under `/media/<key>`, attachments and
 * avatars under `/files/<key>`.
 */
export function storedFilePath(role: StoredFileRole, key: string): string {
  const normalized = key.replace(/^\/+/, "");
  const prefix = role === "MEDIA" ? MEDIA_PATH_PREFIX : FILES_PATH_PREFIX;

  return `${prefix}/${normalized}`;
}

/**
 * The area and key encoded by a canonical address, or `null` when the address
 * is not one of the Installation's own file addresses. Kind is proved by the
 * stored-file record, not by the prefix.
 */
export function storedFileAddress(
  src: string,
): { area: StoredFileAddressArea; key: string } | null {
  const pathname = pathnameOf(src);
  if (!pathname) return null;

  for (const area of ["media", "files"] as const) {
    const prefix = area === "media" ? MEDIA_PATH_PREFIX : FILES_PATH_PREFIX;

    if (pathname === prefix) continue;

    if (pathname.startsWith(`${prefix}/`)) {
      const key = safeDecode(pathname.slice(prefix.length + 1));
      return key.length > 0 ? { area, key } : null;
    }
  }

  return null;
}
