import { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export const RootBlockUi = ({
  children,
  styleVars,
  className,
}: {
  children: ReactNode;
  styleVars: Record<string, string>;
  className?: string;
}) => {
  return (
    <div className={cn("puck-dim puck-layout", className)} style={styleVars}>
      {children}
    </div>
  );
};
