import type { DecorationProps } from "@/puck/fields/decoration";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { Responsive } from "@/puck/utils/responsive";

/**
 * Default look for the Top bar.
 *
 * A new bar is a neutral, full-width strip with comfortable horizontal and
 * vertical padding and no background. Editors add colour and borders through
 * the shared Decoration field when they want a promotion or a language strip.
 *
 * The values travel through the dimension variables because the shared
 * `.puck-dim` guard resets the padding utilities.
 */
export const TOP_BAR_DEFAULT_DIMENSION: Responsive<DimensionProps> = {
  desktop: {
    width: "100%",
    paddingTop: "0.5rem",
    paddingRight: "1rem",
    paddingBottom: "0.5rem",
    paddingLeft: "1rem",
  },
};

export const TOP_BAR_DEFAULT_DECORATION: Responsive<DecorationProps> = {};
