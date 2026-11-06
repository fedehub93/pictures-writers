import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export const TextBlockUi = ({
  text,
  styleVars,
  layoutClassName,
}: {
  text?: ReactNode;
  styleVars: Record<string, string>;
  layoutClassName?: string;
}) => {
  return (
    <p
      className={cn("puck-dim puck-typo whitespace-pre-line", layoutClassName)}
      style={styleVars}
    >
      {text}
    </p>
  );
};
