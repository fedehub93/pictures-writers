import type { SlotComponent } from "@puckeditor/core";

import type { BlockDragRef } from "@/puck/types";
import { cn } from "@/shared/lib/utils";

export type SlotSurfaceProps = {
  /** The block's slot, resolved by Puck from the `items`/`content` field. */
  Items: SlotComponent;
  /** Responsive custom properties for layout, size, spacing, typography and decoration. */
  styleVars: Record<string, string>;
  /** Authored display classes and editor-only visibility markers. */
  layoutClassName?: string;
  /** Editor-only: Puck's drag/selection ref, see {@link BlockDragRef}. */
  dragRef?: BlockDragRef;
};

/**
 * Root element shared by the blocks whose layout surface is their slot.
 *
 * The Container renders exactly this element: the slot *is* the block box, so
 * the authored layout variables, the size/spacing/typography/decoration classes
 * and Puck's selection node all live on it. The expression lives in one module
 * so the render path that draws the canvas and the one that publishes the page
 * cannot drift apart.
 *
 * The selection ref goes on the slot element because the block is `inline`:
 * Puck then skips its per-block wrapper `div` and hands the ref to the block.
 * Puck documents `inline` for rich-text nodes, so an upgrade has to be checked
 * against the narrow behaviour relied on here — skip the wrapper, hand over
 * `dragRef`, and keep forwarding a `ref` from the slot to its element.
 */
export const SlotSurface = ({
  Items,
  styleVars,
  layoutClassName,
  dragRef,
}: SlotSurfaceProps) => (
  <Items
    ref={dragRef}
    className={cn(
      "puck-layout puck-dim puck-typo puck-deco puck-block-root",
      layoutClassName,
    )}
    style={styleVars}
  />
);
