import { Icon } from "@/shared/ui/icon-picker";
import { cn } from "@/shared/lib/utils";

import type { IconProps } from "@/puck/fields/icon";

export const IconBlockUi = ({
  icon,
  styleVars,
  layoutClassName,
}: {
  icon?: IconProps;
  styleVars: Record<string, string>;
  layoutClassName?: string;
}) => {
  const className = cn("puck-dim puck-typo", layoutClassName);

  if (!icon?.name) {
    return (
      <Icon
        name="circle-question-mark"
        className={className}
        style={styleVars}
      />
    );
  }

  return <Icon name={icon.name} className={className} style={styleVars} />;
};
