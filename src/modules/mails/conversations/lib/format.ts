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

/** Prefix a subject with `Re:` unless it already is a reply. */
export function replySubject(subject?: string | null): string {
  const trimmed = subject?.trim();
  if (!trimmed) return "Re:";
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Render an `EmailAccount` signature as editor HTML so it can be pre-filled in
 * the reply composer. Plain text only (untrusted); newlines become paragraphs.
 */
export function signatureToHtml(signature?: string | null): string {
  const trimmed = signature?.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p></p>"))
    .join("");
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

/**
 * Split a free-form display name into `firstName` / `lastName` parts for a
 * manually-created `EmailContact`. The first token is the first name; the rest
 * form the last name.
 */
export function splitName(name?: string | null): {
  firstName: string | null;
  lastName: string | null;
} {
  const trimmed = name?.trim();
  if (!trimmed) return { firstName: null, lastName: null };

  const [first, ...rest] = trimmed.split(/\s+/);
  return {
    firstName: first || null,
    lastName: rest.length > 0 ? rest.join(" ") : null,
  };
}
