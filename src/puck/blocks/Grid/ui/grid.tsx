import { SlotComponent } from "@puckeditor/core";

import { cn } from "@/lib/utils";

export const GridBlockUi = ({
  Items,
  styleVars,
}: {
  Items: SlotComponent;
  styleVars: Record<string, string>;
}) => {
  return (
    <Items
      className={cn(
        "puck-grid puck-dim puck-typo puck-deco *:min-w-0 *:justify-self-stretch",
      )}
      style={styleVars}
    />
  );
};
