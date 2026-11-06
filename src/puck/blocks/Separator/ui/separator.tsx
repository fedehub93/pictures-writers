import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { pickDisplayVars } from "@/puck/fields/layout/get-layout-vars";

export const SeparatorBlockUi = ({
  styleVars,
  layoutClassName,
}: {
  styleVars: Record<string, string>;
  layoutClassName?: string;
}) => {
  const displayStyleVars = pickDisplayVars(styleVars);

  return (
    <div
      className={cn("w-full min-w-full", layoutClassName)}
      style={displayStyleVars}
    >
      <Separator style={styleVars} className="puck-dim" />
    </div>
  );
};
