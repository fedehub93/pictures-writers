import type { Responsive } from "@/puck/utils/responsive";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { TypographyProps } from "@/puck/fields/typography";
import type { DecorationProps } from "@/puck/fields/decoration";
import type { Breakpoint } from "@/puck/utils/breakpoints";

const BREAKPOINTS: Breakpoint[] = ["desktop", "tablet", "mobile"];

// Suffix interni per le variabili CSS: desktop -> d, tablet -> t, mobile -> m
const getSuffix = (bp: Breakpoint) => bp.charAt(0);

/** The width a *Fill* box resolves to; the implied fill below emits the same. */
const FILL_WIDTH = "100%";

export interface SizeVarOptions {
  /**
   * The width the block resolves to when no width is authored: its natural
   * size. It is a block constant, not a document value, so it needs no
   * migration.
   */
  baseWidth?: string;
}

/**
 * UTILITY: SIZE
 *
 * Width precedence, highest first: an authored width at the breakpoint (own or
 * inherited from a wider one, the explicit `auto` included) → the block base
 * width → the implied fill a content-area block gets when it authors only a
 * max width. A block with a base width has a natural size, so it never needs
 * the fill to stop it collapsing.
 */
export const getSizeVars = (
  data?: Responsive<SizeProps>,
  { baseWidth }: SizeVarOptions = {},
) => {
  const base = baseWidth?.trim();

  if (!data && !base) return {};
  const vars: Record<string, string> = {};

  // The widths cascade desktop -> mobile, so the rules below have to know
  // whether a wider breakpoint already resolved one. The base width counts as
  // resolved from the rung it is emitted on, which is the widest one: every
  // narrower breakpoint inherits it through the ladder, and an authored width
  // below overwrites it.
  let inheritedWidth: string | undefined;

  if (base) {
    vars["--w-d"] = base;
    inheritedWidth = base;
  }

  for (const bp of BREAKPOINTS) {
    const p = data?.[bp];
    if (!p) continue;
    const s = getSuffix(bp);

    // A box that caps its own width is a content area, not a shrink-to-fit
    // label: with no width at all it collapses inside a flex parent instead of
    // filling the space its `max-width` caps. Both render paths call this same
    // function, so the rule cannot diverge between the canvas and the page.
    // An authored width — `fit-content` included, and one inherited from a
    // wider breakpoint — always wins over the implied fill.
    //
    // An empty value means "nothing decided here", so the breakpoint inherits.
    // A stored `auto` is the explicit CSS keyword: it is authored, and it
    // cancels an inherited width instead of inheriting it.
    const width = p.width?.trim();
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
  }

  return vars;
};

/**
 * UTILITY: SPACING
 *
 * The eight margin and padding variables. They share the Breakpoint suffix and
 * the reset scope with the size variables: both land on the same block root,
 * so `.puck-dim` resets and consumes the whole box (see `puck-base.css`).
 */
export const getSpacingVars = (data?: Responsive<SpacingProps>) => {
  if (!data) return {};
  const vars: Record<string, string> = {};

  for (const bp of BREAKPOINTS) {
    const p = data[bp];
    if (!p) continue;
    const s = getSuffix(bp);

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
 * The Decoration property list, emitted once for the base state and once per
 * state. `infix` is empty for the base state and carries the State's own
 * name for a stateful one: `h-` turns `--bgc-d` into `--bgc-h-d`.
 */
const collectDecorationVars = (
  data: Responsive<DecorationProps> | undefined,
  infix: string,
) => {
  if (!data) return {};
  const vars: Record<string, string> = {};

  for (const bp of BREAKPOINTS) {
    const p = data[bp];
    if (!p) continue;
    const s = getSuffix(bp);

    if (p.opacity) vars[`--op-${infix}${s}`] = p.opacity;
    if (p.backgroundColor) vars[`--bgc-${infix}${s}`] = p.backgroundColor;
    if (p.borderTopWidth) vars[`--btw-${infix}${s}`] = p.borderTopWidth;
    if (p.borderRightWidth) vars[`--brw-${infix}${s}`] = p.borderRightWidth;
    if (p.borderBottomWidth) vars[`--bbw-${infix}${s}`] = p.borderBottomWidth;
    if (p.borderLeftWidth) vars[`--blw-${infix}${s}`] = p.borderLeftWidth;
    if (p.borderStyle) vars[`--bs-${infix}${s}`] = p.borderStyle;
    if (p.borderColor) vars[`--bc-${infix}${s}`] = p.borderColor;
    if (p.borderTopLeftRadius) vars[`--rtl-${infix}${s}`] = p.borderTopLeftRadius;
    if (p.borderTopRightRadius)
      vars[`--rtr-${infix}${s}`] = p.borderTopRightRadius;
    if (p.borderBottomLeftRadius)
      vars[`--rbl-${infix}${s}`] = p.borderBottomLeftRadius;
    if (p.borderBottomRightRadius)
      vars[`--rbr-${infix}${s}`] = p.borderBottomRightRadius;
  }

  return vars;
};

/**
 * UTILITY: DECORATION
 */
export const getDecorationVars = (data?: Responsive<DecorationProps>) =>
  collectDecorationVars(data, "");

/**
 * The infix the hover state appends to a Style variable: `--bgc-h-d`.
 *
 * Only hover exists today. A second state brings its own infix rather than a
 * type, because the naming contract is the only part that has to be right now
 * (ADR-0043).
 */
export const HOVER_STATE = "h";

/**
 * UTILITY: DECORATION UNDER A STATE
 *
 * A State appends its own Style variables instead of redefining the base ones:
 * an authored value reaches the Block root as an inline custom property, and
 * no stylesheet rule could outrank it. The State is an infix, so the
 * Breakpoint stays the suffix every other reader parses — `--bgc-h-d` is the
 * desktop background under the hover state (ADR-0043). The State is the outer
 * axis and the Breakpoint the inner one, matching the CSS: the state's rule
 * outside, the media query inside.
 */
export const getDecorationStateVars = (
  data: Responsive<DecorationProps> | undefined,
  state: string,
) => collectDecorationVars(data, `${state}-`);
