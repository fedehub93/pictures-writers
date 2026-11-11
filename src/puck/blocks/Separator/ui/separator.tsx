import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import type { BlockDragRef } from "@/puck/types";

export const SeparatorBlockUi = ({
  styleVars,
  layoutClassName,
  dragRef,
}: {
  styleVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
}) => {
  return (
    // The authored dimension describes the block box, so this element owns both
    // the size variables and the editor's selection ref; the rule below only
    // fills it. No `w-full`/`min-w-full` here: they would override an authored
    // width through `min-width`.
    <div
      ref={dragRef}
      className={cn("puck-dim", layoutClassName)}
      style={styleVars}
    >
      {/* `height: 100%` follows the authored height; the 1px minimum is what the
          Radix rule used to provide on its own, so a document that stores no
          height keeps a visible line. */}
      <Separator
        className="w-full"
        style={{ height: "100%", minHeight: "1px" }}
      />
    </div>
  );
};
