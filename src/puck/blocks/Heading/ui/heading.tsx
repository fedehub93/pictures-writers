import { type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export const HeadingBlockUi = ({
  text,
  styleVars,
}: {
  text?: ReactNode;
  styleVars: Record<string, string>;
}) => {
  return (
    <div className={cn("block puck-dim puck-typo")} style={styleVars}>
      {text}
    </div>
  );
};
