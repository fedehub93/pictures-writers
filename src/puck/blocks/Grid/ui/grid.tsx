import { SlotComponent } from "@puckeditor/core";

export const GridBlockUi = ({
  Items,
  styleVars,
}: {
  Items: SlotComponent;
  styleVars: Record<string, string>;
}) => {
  return (
    <div>
      <Items
        className="puck-layout puck-dim puck-typo puck-deco"
        style={styleVars}
      />
    </div>
  );
};
