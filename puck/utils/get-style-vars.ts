import { Responsive } from "@/puck/utils/responsive";
import { DimensionProps } from "@/puck/fields/dimension";
import { TypographyProps } from "@/puck/fields/typography";
import { GridProps } from "@/puck/fields/grid";
import { DecorationProps } from "@/puck/fields/decoration";
import { Breakpoint } from "@/puck/utils/breakpoints";

const BREAKPOINTS: Breakpoint[] = ["desktop", "tablet", "mobile"];

// Suffix interni per le variabili CSS: desktop -> d, tablet -> t, mobile -> m
const getSuffix = (bp: Breakpoint) => bp.charAt(0);

/**
 * UTILITY: DIMENSION
 */
export const getDimensionVars = (data?: Responsive<DimensionProps>) => {
  if (!data) return {};
  const vars: Record<string, string> = {};

  for (const bp of BREAKPOINTS) {
    const p = data[bp];
    if (!p) continue;
    const s = getSuffix(bp);

    if (p.width) vars[`--w-${s}`] = p.width;
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
const fontWeightMap: Record<string, string> = {
  "font-light": "300",
  "font-normal": "400",
  "font-medium": "500",
  "font-bold": "700",
};

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

    if (p.fontWeight) {
      vars[`--fw-${s}`] = fontWeightMap[p.fontWeight] || p.fontWeight;
    }
  }

  return vars;
};

/**
 * UTILITY: GRID
 */
export const getGridVars = (data?: Responsive<GridProps>) => {
  if (!data) return {};
  const vars: Record<string, string> = {};

  for (const bp of BREAKPOINTS) {
    const p = data[bp];
    if (!p) continue;
    const s = getSuffix(bp);

    if (p.columns) vars[`--cols-${s}`] = p.columns;
    if (p.gap) vars[`--gap-${s}`] = p.gap;
    if (p.alignItems) vars[`--ai-${s}`] = p.alignItems;
    if (p.justifyItems) vars[`--ji-${s}`] = p.justifyItems;
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
    if (p.borderWidth) vars[`--bw-${s}`] = p.borderWidth;
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
