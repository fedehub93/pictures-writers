import { SlotComponent } from "@puckeditor/core";

import { cn } from "@/shared/lib/utils";

export const ContainerBlockUi = ({
  Items,
  styleVars,
  className,
}: {
  Items: SlotComponent;
  styleVars: Record<string, string>;
  className?: string;
}) => {
  return (
    <Items
      className={cn(
        "puck-layout puck-dim puck-typo puck-deco",
        className ? className : "",
      )}
      style={styleVars}
    />
  );
};
