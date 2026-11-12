/**
 * The heading levels a Heading block may emit.
 *
 * The list is the closed allow-list the render validates against: a stored
 * value outside it cannot become a tag. The level is block semantics, not
 * styling, so it is deliberately not responsive.
 */
export const HEADING_LEVELS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
] as const;

export type HeadingLevel = (typeof HEADING_LEVELS)[number];

/** A heading with no authored level keeps the H2 default. */
export const HEADING_DEFAULT_LEVEL: HeadingLevel = "h2";

export const isHeadingLevel = (value: unknown): value is HeadingLevel =>
  typeof value === "string" &&
  (HEADING_LEVELS as readonly string[]).includes(value);

/** Sidebar options for the Heading level field, one per allowed tag. */
export const HEADING_LEVEL_OPTIONS = HEADING_LEVELS.map((level) => ({
  label: level.toUpperCase(),
  value: level,
}));
