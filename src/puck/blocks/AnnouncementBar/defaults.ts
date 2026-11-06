import type { DecorationProps } from "@/puck/fields/decoration";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { Responsive } from "@/puck/utils/responsive";

/**
 * Default look for the Announcement bar.
 *
 * Shared by the editor component config and the pure render fallback so a new
 * block and a document saved before the shared fields existed keep the previous
 * primary background, primary-foreground text and small centred type.
 *
 * The dimension defaults replace the old `w-full min-h-8 px-10 py-1.5`
 * utilities: the shared `.puck-dim` guard resets those properties, so they must
 * travel through the dimension variables instead of Tailwind classes.
 */
export const ANNOUNCEMENT_DEFAULT_DIMENSION: Responsive<DimensionProps> = {
  desktop: {
    width: "100%",
    minHeight: "2rem",
    paddingTop: "0.375rem",
    paddingRight: "2.5rem",
    paddingBottom: "0.375rem",
    paddingLeft: "2.5rem",
  },
};

export const ANNOUNCEMENT_DEFAULT_TYPOGRAPHY: Responsive<TypographyProps> = {
  desktop: {
    fontSize: "0.75rem",
    lineHeight: "1.25",
    textAlign: "center",
    color: "var(--primary-foreground)",
  },
};

export const ANNOUNCEMENT_DEFAULT_DECORATION: Responsive<DecorationProps> = {
  desktop: {
    backgroundColor: "var(--primary)",
  },
};
