import { MediaType } from "@/generated/prisma";

/**
 * The document MIME types the library accepts.
 *
 * A document is stored untouched, so the list is deliberately explicit: a
 * MIME type the application cannot classify is refused instead of being
 * recorded as a generic "file" and then served from the site's own domain.
 */
const DOCUMENT_MIME_TYPES = new Set([
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/markdown",
  "text/plain",
]);

/**
 * Classifies an upload by its MIME type, returning `null` when the library
 * cannot classify it. One function is shared by the endpoint and the admin
 * form, so the two never disagree about what can be uploaded.
 */
export function classifyMediaType(
  mimeType: string | null | undefined,
): MediaType | null {
  if (!mimeType) return null;

  // A MIME type may carry parameters, e.g. "text/plain; charset=utf-8".
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.startsWith("image/")) return MediaType.IMAGE;
  if (normalized.startsWith("video/")) return MediaType.VIDEO;
  if (normalized.startsWith("audio/")) return MediaType.AUDIO;
  if (DOCUMENT_MIME_TYPES.has(normalized)) return MediaType.FILE;

  return null;
}
