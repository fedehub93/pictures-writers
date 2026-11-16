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

export const PANEL_CONTROL = {
  /** The whole box, for a control that owns its own border. */
  box: `${HEIGHT} ${INSET}`,
  /** The height alone, for a box whose inner control carries the padding. */
  height: HEIGHT,
  /** The picker's box: its icon makes the Button pad itself on a variant. */
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
  return <SelectTrigger size="sm" className={cn(INSET, className)} {...props} />;
}
