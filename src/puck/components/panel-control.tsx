import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";
import { SelectTrigger } from "@/shared/ui/select";

/**
 * The properties panel's compact control box.
 *
 * The panel is the one backoffice surface that renders its controls at 32px;
 * everywhere else, admin included, they keep the vendor's 36px. The height is
 * `h-8`, the horizontal padding `px-2` and the text `text-xs` — important,
 * because the input and select primitives carry `md:text-sm` and the editor
 * runs at those widths.
 *
 * A select cannot take the height as a class: its `sm` size variant sets it,
 * and a variant outranks a plain utility. The same holds for the picker's
 * Button, which pads itself `has-[>svg]:px-3` for its icon. The vendored
 * primitives in `src/shared/ui/` are not edited: a local patch is erased the
 * next time the component is reinstalled (see `CODING_STANDARDS.md`).
 */
const HEIGHT = "h-8";
const INSET = "px-2 text-xs!";

/**
 * The fill every panel control shares.
 *
 * A transparent control takes the colour of whatever it is drawn on, and the
 * panel draws controls both on its own surface and inside `bg-muted/60`
 * groups, so the same field would change shade as it moved between sections.
 * This fill does not: it is `bg-background`, opaque in the light theme, and the
 * same `dark:bg-input/30` tint the text primitives carry, so a panel control
 * looks like a field elsewhere in the admin in both themes. It is not fully
 * opaque in dark, where the tint still composites over the surface — but the
 * two surfaces it sits on differ by about 1% there, so the residual difference
 * is imperceptible while the light theme's is not.
 *
 * It is not part of `box`: the unit input's inner `<input>` takes the box too,
 * and painting it would stack a second translucent layer over the group in
 * dark mode. A token that carries the fill says so in its comment.
 */
const FILL = "bg-background dark:bg-input/30";

export const PANEL_CONTROL = {
  /** The box alone. A control that owns its border adds `fill`, unless it is
   * already drawn inside another boxed control. */
  box: `${HEIGHT} ${INSET}`,
  /** The height alone, for a box whose inner control carries the padding. */
  height: HEIGHT,
  /** The shared background, for a control that owns its own border. */
  fill: FILL,
  /** A two-row textarea: the panel's fill and text, no fixed height. */
  textArea: `${FILL} min-h-16 text-xs`,
  /** The picker's box: its icon makes the Button pad itself on a variant. The
   * fill is not repeated here — the picker is a `Button variant="outline"`,
   * which already carries `bg-background` and its dark tint. */
  picker: `${HEIGHT} ${INSET} has-[>svg]:px-2`,
} as const;

/**
 * A select in the panel. Its height is the vendor's `sm` size variant, which
 * is why it is a trigger of its own rather than a class every caller repeats.
 */
export function PanelSelectTrigger({
  className,
  ...props
}: Omit<ComponentProps<typeof SelectTrigger>, "size">) {
  return (
    <SelectTrigger
      size="sm"
      className={cn(INSET, FILL, className)}
      {...props}
    />
  );
}
