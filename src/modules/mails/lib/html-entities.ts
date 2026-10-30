const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ndash: "\u2013",
  mdash: "\u2014",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201c",
  rdquo: "\u201d",
  hellip: "\u2026",
  bull: "\u2022",
  middot: "\u00b7",
  copy: "\u00a9",
  reg: "\u00ae",
  trade: "\u2122",
  euro: "\u20ac",
  pound: "\u00a3",
  yen: "\u00a5",
  cent: "\u00a2",
  deg: "\u00b0",
  times: "\u00d7",
  divide: "\u00f7",
  plusmn: "\u00b1",
  laquo: "\u00ab",
  raquo: "\u00bb",
  sect: "\u00a7",
  para: "\u00b6",
  frac12: "\u00bd",
  frac14: "\u00bc",
  frac34: "\u00be",
  sup2: "\u00b2",
  sup3: "\u00b3",
  micro: "\u00b5",
  szlig: "\u00df",
  ntilde: "\u00f1",
  aacute: "\u00e1",
  eacute: "\u00e9",
  iacute: "\u00ed",
  oacute: "\u00f3",
  uacute: "\u00fa",
  agrave: "\u00e0",
  egrave: "\u00e8",
  igrave: "\u00ec",
  ograve: "\u00f2",
  ugrave: "\u00f9",
  auml: "\u00e4",
  euml: "\u00eb",
  iuml: "\u00ef",
  ouml: "\u00f6",
  uuml: "\u00fc",
  ccedil: "\u00e7",
};

const NAMED_ENTITY_PATTERN = new RegExp(
  `&(${Object.keys(NAMED_ENTITIES).join("|")});`,
  "gi",
);

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
      NAMED_ENTITY_PATTERN,
      (entity, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? entity,
    );
}
