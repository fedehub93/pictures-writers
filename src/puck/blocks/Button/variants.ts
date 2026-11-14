import type { DecorationProps } from "@/puck/fields/decoration";
import type { TypographyProps } from "@/puck/fields/typography";
import { BREAKPOINTS_IN_ORDER } from "@/puck/utils/breakpoints";
import type { Responsive } from "@/puck/utils/responsive";

import { BUTTON_DEFAULT_VARIANT } from "./constants";
import type { ButtonProps, ButtonVariant } from "./types";

/**
 * One variant's starting look, expressed as the props the author edits.
 *
 * The same values apply at every Breakpoint today. They live as props rather
 * than as a stylesheet class so the render merges them underneath the authored
 * values: an authored value wins at its breakpoint, and a state can override
 * both through the same style variables (ADR-0043).
 */
type VariantStyle = {
  decoration: DecorationProps;
  typography: TypographyProps;
  /**
   * Decoration under the hover state, for a variant that dictates a hover the
   * derived colour cannot give: a transparent background only yields a faint
   * foreground wash, so outline and ghost name the theme's hover surface.
   */
  hover?: DecorationProps;
};

const BORDER_WIDTHS: Pick<
  DecorationProps,
  "borderTopWidth" | "borderRightWidth" | "borderBottomWidth" | "borderLeftWidth"
> = {
  borderTopWidth: "1px",
  borderRightWidth: "1px",
  borderBottomWidth: "1px",
  borderLeftWidth: "1px",
};

const CORNER_RADII: Pick<
  DecorationProps,
  | "borderTopLeftRadius"
  | "borderTopRightRadius"
  | "borderBottomLeftRadius"
  | "borderBottomRightRadius"
> = {
  borderTopLeftRadius: "var(--radius)",
  borderTopRightRadius: "var(--radius)",
  borderBottomLeftRadius: "var(--radius)",
  borderBottomRightRadius: "var(--radius)",
};

/**
 * Every variant shares the box and the weight, so switching variant never
 * changes the button's size; only the colours differ.
 */
const variant = (
  backgroundColor: string,
  borderColor: string,
  color: string,
  hover?: DecorationProps,
): VariantStyle => ({
  decoration: {
    backgroundColor,
    borderStyle: "solid",
    borderColor,
    ...BORDER_WIDTHS,
    ...CORNER_RADII,
  },
  typography: {
    color,
    fontWeight: "500",
  },
  ...(hover ? { hover } : {}),
});

/**
 * The hover a transparent variant dictates: the theme's hover surface. The
 * derived colour would only be a faint wash of the foreground over a
 * transparent background, so the transparent variants name the theme's surface
 * instead.
 */
const HOVER_SURFACE: DecorationProps = {
  backgroundColor: "var(--accent)",
};

const BUTTON_VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: variant(
    "var(--primary)",
    "var(--primary)",
    "var(--primary-foreground)",
  ),
  secondary: variant(
    "var(--secondary)",
    "var(--secondary)",
    "var(--secondary-foreground)",
  ),
  outline: variant(
    "transparent",
    "var(--border)",
    "var(--foreground)",
    HOVER_SURFACE,
  ),
  ghost: variant(
    "transparent",
    "transparent",
    "var(--foreground)",
    HOVER_SURFACE,
  ),
};

/**
 * Place a variant's values underneath the authored ones, key by key, at every
 * Breakpoint.
 *
 * An authored value that is explicitly `undefined` counts as cleared: the
 * colour and unit controls can leave such a key behind, and it must not erase
 * the variant's value. The merged object is a new one, so a variant change
 * re-emits the styles without touching the stored props.
 *
 * The variant is materialized at every rung rather than only at desktop, which
 * is what makes "the variant applies where nothing was authored" true per
 * breakpoint: an authored desktop value does not stop the variant's tablet
 * value from applying there.
 */
const mergeVariant = <T extends object>(
  authored: Responsive<T> | undefined,
  variantValues: T,
): Responsive<T> => {
  const merged: Responsive<T> = { ...authored };

  for (const breakpoint of BREAKPOINTS_IN_ORDER) {
    const values = { ...variantValues };
    const authoredValues = authored?.[breakpoint];

    for (const key of Object.keys(authoredValues ?? {}) as Array<keyof T>) {
      const value = authoredValues?.[key];
      if (value !== undefined) values[key] = value;
    }

    merged[breakpoint] = values;
  }

  return merged;
};

/**
 * The Typography and Decoration the render should turn into style variables:
 * the chosen variant's values, with the authored values layered over them.
 *
 * `hover` carries the variant's own hover, materialized at every Breakpoint
 * through the same merge pipeline the base values use. A variant dictates one
 * only where the derived colour does not read; an author has no hover control
 * yet, so nothing is layered over it — when one arrives, it wins here as every
 * other authored value does.
 */
export const resolveButtonVariantStyles = (
  variantName: ButtonVariant | undefined,
  {
    typography,
    decoration,
  }: Pick<ButtonProps, "typography" | "decoration">,
) => {
  // Stored Puck data is not validated, so an unknown value falls back to the
  // default instead of crashing the page.
  const style =
    BUTTON_VARIANTS[variantName as ButtonVariant] ??
    BUTTON_VARIANTS[BUTTON_DEFAULT_VARIANT];

  return {
    typography: mergeVariant(typography, style.typography),
    decoration: mergeVariant(decoration, style.decoration),
    hover: style.hover ? mergeVariant(undefined, style.hover) : undefined,
  };
};
