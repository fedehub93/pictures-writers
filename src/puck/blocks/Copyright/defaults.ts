import type { TypographyProps } from "@/puck/fields/typography";
import type { Responsive } from "@/puck/utils/responsive";

/**
 * Default typography for the Copyright line.
 *
 * Shared by the editor component config and the generic Site region fallback so
 * a new block and a never-published region keep the small footer type size.
 */
export const COPYRIGHT_DEFAULT_TYPOGRAPHY: Responsive<TypographyProps> = {
  desktop: {
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
};
