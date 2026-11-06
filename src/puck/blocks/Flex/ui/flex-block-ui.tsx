import { SlotComponent } from "@puckeditor/core";

import { cn } from "@/shared/lib/utils";

export const FlexBlockUi = ({
  Items,
  styleVars,
  layoutClassName,
}: {
  Items: SlotComponent;
  styleVars: Record<string, string>;
  layoutClassName?: string;
}) => {
  return (
    <Items
      className={cn(
        "puck-layout puck-dim puck-typo puck-deco",
        layoutClassName,
      )}
      style={styleVars}
    />
  );
};
