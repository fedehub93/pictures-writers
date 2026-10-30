import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
} from "date-fns";

import { htmlToPlainText } from "@/modules/mails/lib/html-to-text";

export { htmlToPlainText as htmlToText };

/**
 * Resolve a stored message body to readable text. Prefer the composed HTML so
 * historical rows with a lossy text part (or none) still read correctly; only
 * fall back to the stored text when there is no HTML-derived text.
 */
export function messageBody(message: {
  bodyText?: string | null;
  bodyHtml?: string | null;
}): string {
  const html = message.bodyHtml?.trim();
  if (html) {
    const text = htmlToPlainText(html);
    if (text) return text;
  }

  return message.bodyText?.trim() ?? "";
}

/** A single-line snippet derived from the same text as the body. */
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

/**
 * Parse an email header address such as `"Jessica Ball" <jessica@example.com>`
 * or a bare address into its display name and email parts.
 */
export function parseAddress(raw: string): { name?: string; email: string } {
  const match = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);

  if (!match) {
    return { email: raw.trim() };
  }

  const name = match[1]?.trim().replace(/^"|"$/g, "").trim();
  const email = match[2]?.trim() ?? raw.trim();

  return name ? { name, email } : { email };
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
