import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
} from "date-fns";

const NAMED_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(
      /&(nbsp|amp|lt|gt|quot|#39|apos);/gi,
      (entity) => NAMED_ENTITIES[entity.toLowerCase()] ?? entity,
    );
}

/**
 * Email bodies are untrusted, so the inbox never renders their HTML. It shows
 * the `text/plain` part or, failing that, text derived from this stripper.
 */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function messageBody(message: {
  bodyText?: string | null;
  bodyHtml?: string | null;
}): string {
  const text = message.bodyText?.trim();
  if (text) return text;

  return message.bodyHtml ? htmlToText(message.bodyHtml) : "";
}

export function messagePreview(
  message: { bodyText?: string | null; bodyHtml?: string | null },
  maxLength = 180,
): string {
  return messageBody(message).replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function initials(value: string, fallback = "?"): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const localPart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const parts = localPart.split(/[\s._-]+/).filter(Boolean);

  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function formatFileSize(bytes?: number | null, fallback = "—"): string {
  if (bytes === null || bytes === undefined) return fallback;
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/** Compact relative time for the inbox list, e.g. `1m`, `3h`, `2d`, `28 Aug`. */
export function formatRelativeTime(
  value: Date | string,
  now: Date = new Date(),
): string {
  const date = typeof value === "string" ? new Date(value) : value;

  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h`;

  const days = differenceInDays(now, date);
  if (days < 7) return `${days}d`;

  return format(date, "d MMM");
}

export function formatMessageDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "EEE d MMM yyyy, HH:mm");
}
