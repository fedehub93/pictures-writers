const NAMED_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function codePointToString(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";

  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/** Decode the numeric and named entities that appear in stored email bodies. */
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      codePointToString(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      codePointToString(parseInt(code, 16)),
    )
    .replace(
      /&(nbsp|amp|lt|gt|quot|#39|apos);/gi,
      (entity) => NAMED_ENTITIES[entity.toLowerCase()] ?? entity,
    );
}
