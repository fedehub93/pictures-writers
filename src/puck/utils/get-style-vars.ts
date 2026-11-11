import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { DecorationProps } from "@/puck/fields/decoration";
import type { Breakpoint } from "@/puck/utils/breakpoints";

const BREAKPOINTS: Breakpoint[] = ["desktop", "tablet", "mobile"];

// Suffix interni per le variabili CSS: desktop -> d, tablet -> t, mobile -> m
const getSuffix = (bp: Breakpoint) => bp.charAt(0);

/** The width a *Fill* box resolves to; the implied fill below emits the same. */
export const FILL_WIDTH = "100%";

/**
 * The width a breakpoint actually authors, or `undefined` when it decides
 * nothing. An empty value and the explicit `auto` keyword mean the same thing
 * — "the browser decides" — so a document that stored `auto` behaves exactly
 * like one that stored nothing.
 */
export const normalizeAuthoredWidth = (width?: string) => {
  const value = width?.trim();

  return value && value.toLowerCase() !== "auto" ? value : undefined;
};

/**
 * UTILITY: DIMENSION
 */
export const getDimensionVars = (data?: Responsive<DimensionProps>) => {
  if (!data) return {};
  const vars: Record<string, string> = {};

  // The widths cascade desktop -> mobile, so the implied fill below has to know
  // whether a wider breakpoint already authored one.
  let inheritedWidth: string | undefined;

  for (const bp of BREAKPOINTS) {
    const p = data[bp];
    if (!p) continue;
    const s = getSuffix(bp);

    // A box that caps its own width is a content area, not a shrink-to-fit
    // label: with no width at all it collapses inside a flex parent instead of
    // filling the space its `max-width` caps. Both render paths call this same
    // function, so the rule cannot diverge between the canvas and the page.
    // An authored width — `fit-content` included, and one inherited from a
    // wider breakpoint — always wins over the implied fill.
    const width = normalizeAuthoredWidth(p.width);
    if (width) {
      vars[`--w-${s}`] = width;
      inheritedWidth = width;
    } else if (!inheritedWidth && p.maxWidth) {
      vars[`--w-${s}`] = FILL_WIDTH;
    }
    if (p.height) vars[`--h-${s}`] = p.height;
    if (p.maxWidth) vars[`--mw-${s}`] = p.maxWidth;
    if (p.minHeight) vars[`--mh-${s}`] = p.minHeight;
    if (p.aspectRatio) vars[`--ratio-${s}`] = p.aspectRatio;
    if (p.marginTop) vars[`--mt-${s}`] = p.marginTop;
    if (p.marginRight) vars[`--mr-${s}`] = p.marginRight;
    if (p.marginBottom) vars[`--mb-${s}`] = p.marginBottom;
    if (p.marginLeft) vars[`--ml-${s}`] = p.marginLeft;
    if (p.paddingTop) vars[`--pt-${s}`] = p.paddingTop;
    if (p.paddingRight) vars[`--pr-${s}`] = p.paddingRight;
    if (p.paddingBottom) vars[`--pb-${s}`] = p.paddingBottom;
    if (p.paddingLeft) vars[`--pl-${s}`] = p.paddingLeft;
  }

  return vars;
};

/**
 * UTILITY: TYPOGRAPHY
 */

export const getTypographyVars = (data?: Responsive<TypographyProps>) => {
  if (!data) return {};
  const vars: Record<string, string> = {};

  for (const bp of BREAKPOINTS) {
    const p = data[bp];
    if (!p) continue;
    const s = getSuffix(bp);

    if (p.fontFamily && p.fontFamily !== "inherit")
      vars[`--ff-${s}`] = p.fontFamily;
    if (p.fontSize) vars[`--fs-${s}`] = p.fontSize;
    if (p.lineHeight) vars[`--lh-${s}`] = p.lineHeight;
    if (p.letterSpacing) vars[`--ls-${s}`] = p.letterSpacing;
    if (p.textAlign) vars[`--ta-${s}`] = p.textAlign;
    if (p.color) vars[`--tc-${s}`] = p.color;

    if (p.fontWeight) {
      vars[`--fw-${s}`] = p.fontWeight;
    }
  }

  return vars;
};

/**
 * UTILITY: DECORATION
 */
export const getDecorationVars = (data?: Responsive<DecorationProps>) => {
  if (!data) return {};
  const vars: Record<string, string> = {};

  for (const bp of BREAKPOINTS) {
    const p = data[bp];
    if (!p) continue;
    const s = getSuffix(bp);

    if (p.opacity) vars[`--op-${s}`] = p.opacity;
    if (p.backgroundColor) vars[`--bgc-${s}`] = p.backgroundColor;
    if (p.borderTopWidth) vars[`--btw-${s}`] = p.borderTopWidth;
    if (p.borderRightWidth) vars[`--brw-${s}`] = p.borderRightWidth;
    if (p.borderBottomWidth) vars[`--bbw-${s}`] = p.borderBottomWidth;
    if (p.borderLeftWidth) vars[`--blw-${s}`] = p.borderLeftWidth;
    if (p.borderStyle) vars[`--bs-${s}`] = p.borderStyle;
    if (p.borderColor) vars[`--bc-${s}`] = p.borderColor;
    if (p.borderTopLeftRadius) vars[`--rtl-${s}`] = p.borderTopLeftRadius;
    if (p.borderTopRightRadius) vars[`--rtr-${s}`] = p.borderTopRightRadius;
    if (p.borderBottomLeftRadius) vars[`--rbl-${s}`] = p.borderBottomLeftRadius;
    if (p.borderBottomRightRadius)
      vars[`--rbr-${s}`] = p.borderBottomRightRadius;
  }

  return vars;
};
