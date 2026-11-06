import { type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export const HeadingBlockUi = ({
  text,
  styleVars,
  layoutClassName,
}: {
  text?: ReactNode;
  styleVars: Record<string, string>;
  layoutClassName?: string;
}) => {
  return (
    <div
      className={cn("block puck-dim puck-typo", layoutClassName)}
      style={styleVars}
    >
      {text}
    </div>
  );
};
