import type { TypographyProps } from "@/puck/fields/typography";
import type { Responsive } from "@/puck/utils/responsive";

import type { CopyrightBlockContent } from "./types";

/**
 * Default content of a new Copyright block.
 *
 * The renderer and the editor controls both read these values, so a new block
 * and a document saved with the content object agree on the initial line.
 * Documents with the previous flat props are converted by the one-off
 * migration utility; there is no runtime compatibility layer.
 */
export const COPYRIGHT_DEFAULT_CONTENT = {
  showYear: true,
  extraText: "",
  links: [],
} satisfies CopyrightBlockContent;

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
