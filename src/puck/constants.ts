export const THEME_COLORS = [
  { label: "Primary", value: "var(--primary)", bgPreview: "var(--primary)" },
  {
    label: "Secondary",
    value: "var(--secondary)",
    bgPreview: "var(--secondary)",
  },
  {
    label: "Muted Foreground",
    value: "var(--muted-foreground)",
    bgPreview: "var(--muted-foreground)",
  },
  {
    label: "Accent Foreground",
    value: "var(--accent-foreground)",
    bgPreview: "var(--accent-foreground)",
  },
];

export const PALETTE_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#000000", // Black
  "#ffffff", // White
];

export type ColorOption = { label: string; value: string };

/**
 * Build the option list shared by every "pick a color" field: the theme
 * tokens, optional block-specific tokens, then the fixed palette. An empty
 * value means "inherit", so callers can leave the color unset.
 */
export function buildColorOptions(
  extraColors: ColorOption[] = [],
): ColorOption[] {
  return [
    { label: "Default", value: "" },
    ...THEME_COLORS.map(({ label, value }) => ({ label, value })),
    ...extraColors,
    ...PALETTE_COLORS.map((value) => ({ label: value, value })),
  ];
}
