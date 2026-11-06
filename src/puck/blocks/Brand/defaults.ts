import type { TypographyProps } from "@/puck/fields/typography";
import type { Responsive } from "@/puck/utils/responsive";

/**
 * Default typography for the Brand site name.
 *
 * Shared by the editor component config and the pure render fallback so a new
 * block and a document saved before the typography field existed keep the
 * previous `text-lg font-semibold tracking-widest` look.
 */
export const BRAND_DEFAULT_TYPOGRAPHY: Responsive<TypographyProps> = {
  desktop: {
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
    fontWeight: "600",
    letterSpacing: "0.1em",
  },
};
