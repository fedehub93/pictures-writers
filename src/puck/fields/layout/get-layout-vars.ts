import { getSuffix } from "@/puck/utils/get-suffix";
import type { Responsive } from "@/puck/utils/responsive";
import type { Breakpoint } from "@/puck/utils/breakpoints";

import type { LayoutProps } from "./index";

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
    if (p.flexWrap !== undefined) vars[`--fwrap-${s}`] = String(p.flexWrap);
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
  }

  return vars;
};

const filterVars = (
  vars: Record<string, string>,
  predicate: (name: string, value: string) => boolean,
) =>
  Object.fromEntries(
    Object.entries(vars).filter(([name, value]) => predicate(name, value)),
  );

/**
 * Extract only the responsive display variables from a style-variable map.
 *
 * The leaf blocks author display only (`DisplayOnlyLayoutField`), but
 * `getLayoutVars` reads whatever a document stores, which may carry other
 * layout properties from an older or hand-edited document. Keeping just the
 * display half stops a stray `flex` or `gap` from landing on a box that does
 * not arrange children.
 */
export const pickDisplayVars = (vars: Record<string, string>) =>
  filterVars(vars, (name) => name.startsWith("--disp-"));

/**
 * Partition a style-variable map into the three surfaces a layout can touch.
 *
 * - `displayVars` hides or reveals the block; a block whose layout surface
 *   moved to an inner element needs it on both boxes.
 * - `itemVars` (`align-self`) describes the block as a child of its parent, so
 *   it stays on the root.
 * - `containerVars` arranges the block's children (direction, wrap, justify,
 *   align, content, items, gaps and grid tracks) on the layout surface.
 */
export const partitionLayoutVars = (vars: Record<string, string>) => ({
  displayVars: filterVars(vars, (name) => name.startsWith("--disp-")),
  itemVars: filterVars(vars, (name) => name.startsWith("--as-")),
  containerVars: filterVars(
    vars,
    (name) => !name.startsWith("--disp-") && !name.startsWith("--as-"),
  ),
});

/**
 * Drop `display: none` from a responsive variable map.
 *
 * The editor canvas forces a block hidden at the selected viewport back into
 * the flow so it stays selectable. When the layout surface is an inner element,
 * a local `none` would keep its content invisible even though the block root is
 * a visible placeholder, so the canvas omits the hidden value and lets the
 * cascade resolve the nearest visible breakpoint instead.
 */
export const omitHiddenDisplayVars = (vars: Record<string, string>) =>
  filterVars(
    vars,
    (name, value) => !(name.startsWith("--disp-") && value === "none"),
  );
