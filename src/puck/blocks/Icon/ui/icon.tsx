import { Icon } from "@/shared/ui/icon-picker";
import { cn } from "@/shared/lib/utils";

import type { IconProps } from "@/puck/fields/icon";
import type { BlockDragRef } from "@/puck/types";

export const IconBlockUi = ({
  icon,
  styleVars,
  layoutClassName,
  dragRef,
}: {
  icon?: IconProps;
  styleVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
}) => {
  const className = cn("puck-dim puck-typo", layoutClassName);

  // The icon *is* the block: the ref goes on the rendered `<svg>`, which is the
  // box the parent lays out, not on a wrapper around it.
  if (!icon?.name) {
    return (
      <Icon
        ref={dragRef}
        name="circle-question-mark"
        className={className}
        style={styleVars}
      />
    );
  }

  return (
    <Icon
      ref={dragRef}
      name={icon.name}
      className={className}
      style={styleVars}
    />
  );
};
