import { Icon } from "@/shared/ui/icon-picker";

import { IconProps } from "@/puck/fields/icon";

export const IconBlockUi = ({
  icon,
  styleVars,
}: {
  icon?: IconProps;
  styleVars: Record<string, string>;
}) => {
  if (!icon?.name) {
    return (
      <Icon
        name="circle-question-mark"
        className="puck-dim puck-typo"
        style={styleVars}
      />
    );
  }

  return (
    <Icon name={icon.name} className="puck-dim puck-typo" style={styleVars} />
  );
};
