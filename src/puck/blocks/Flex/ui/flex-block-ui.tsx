import { SlotComponent } from "@puckeditor/core";

export const FlexBlockUi = ({
  Items,
  styleVars,
}: {
  Items: SlotComponent;
  styleVars: Record<string, string>;
}) => {
  return (
    <Items
      className="puck-layout puck-dim puck-typo puck-deco"
      style={styleVars}
    />
  );
};
