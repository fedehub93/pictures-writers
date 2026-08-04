import { getSuffix } from "@/puck/utils/get-suffix";
import { Responsive } from "@/puck/utils/responsive";
import { Breakpoint } from "@/puck/utils/breakpoints";

import { LayoutProps } from "./types";

const BREAKPOINTS: Breakpoint[] = ["desktop", "tablet", "mobile"];

const formatGridTrack = (v?: string): string => {
  if (!v) return "1fr";

  const trimmed = v.trim().toLowerCase();

  // Gestione di 0 o 0fr
  if (trimmed === "0" || trimmed === "0fr") {
    return "0px";
  }

  // Estrae il numero prima di "fr" (es. "2fr" -> 2)
  const match = trimmed.match(/^(\d+)fr$/);

  if (match) {
    const count = parseInt(match[1], 10);
    if (count > 0) {
      return Array(count).fill("1fr").join(" ");
    }
  }

  // Se è già un valore CSS standard (es. "100px", "auto", "repeat(...)")
  return trimmed;
};

export const getLayoutVars = (data?: Responsive<LayoutProps>) => {
  if (!data) return {};
  const vars: Record<string, string> = {};

  for (const bp of BREAKPOINTS) {
    const p = data[bp];
    if (!p) continue;
    const s = getSuffix(bp);

    if (p.display !== undefined) vars[`--disp-${s}`] = String(p.display);
    if (p.flexDirection !== undefined)
      vars[`--fd-${s}`] = String(p.flexDirection);
    if (p.flexWrap !== undefined) vars[`--fw-${s}`] = String(p.flexWrap);
    if (p.justifyContent !== undefined)
      vars[`--jc-${s}`] = String(p.justifyContent);
    if (p.alignItems !== undefined) vars[`--ai-${s}`] = String(p.alignItems);
    if (p.alignContent !== undefined)
      vars[`--ac-${s}`] = String(p.alignContent);
    if (p.justifyItems !== undefined)
      vars[`--ji-${s}`] = String(p.justifyItems);
    if (p.alignSelf !== undefined) vars[`--as-${s}`] = String(p.alignSelf);
    if (p.rowGap !== undefined) vars[`--rgap-${s}`] = String(p.rowGap);
    if (p.columnGap !== undefined) vars[`--cgap-${s}`] = String(p.columnGap);
    if (p.gridTemplateColumns !== undefined)
      vars[`--gtc-${s}`] = formatGridTrack(p.gridTemplateColumns);
    if (p.gridTemplateRows !== undefined)
      vars[`--gtr-${s}`] = formatGridTrack(p.gridTemplateRows);

    // if (p.gridColumn !== undefined) vars[`--gc-${s}`] = String(p.gridColumn);
    // if (p.gridRow !== undefined) vars[`--gr-${s}`] = String(p.gridRow);

    // Convertiti a stringa nel caso vengano passati come numeri
    // if (p.order !== undefined) vars[`--ord-${s}`] = String(p.order);
    // if (p.flexGrow !== undefined) vars[`--fg-${s}`] = String(p.flexGrow);
    // if (p.flexShrink !== undefined) vars[`--fs-${s}`] = String(p.flexShrink);
    // if (p.flexBasis !== undefined) vars[`--fb-${s}`] = String(p.flexBasis);
  }

  return vars;
};
