import type { DecorationProps } from "@/puck/fields/decoration";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { LayoutProps } from "@/puck/fields/layout";
import type { Responsive } from "@/puck/utils/responsive";

/**
 * Default look for the Top bar.
 *
 * A new bar is a neutral, full-width strip with comfortable horizontal and
 * vertical padding and no background. Editors add colour and borders through
 * the shared Decoration field when they want a promotion or a language strip.
 *
 * The width travels through the size variables and the padding through the
 * spacing ones, because the shared `.puck-dim` guard resets both.
 */
export const TOP_BAR_DEFAULT_SIZE: Responsive<SizeProps> = {
  desktop: {
    width: "100%",
  },
};

export const TOP_BAR_DEFAULT_SPACING: Responsive<SpacingProps> = {
  desktop: {
    paddingTop: "0.5rem",
    paddingRight: "1rem",
    paddingBottom: "0.5rem",
    paddingLeft: "1rem",
  },
};

/**
 * The strip is a flex row by default: the slot's blocks are laid out on one
 * line and stay vertically centred. Keeping it as the block default means the
 * shared Layout field starts from the real look instead of an inline box.
 */
export const TOP_BAR_DEFAULT_LAYOUT: Responsive<LayoutProps> = {
  desktop: {
    display: "flex",
    alignItems: "center",
  },
};

export const TOP_BAR_DEFAULT_DECORATION: Responsive<DecorationProps> = {};
