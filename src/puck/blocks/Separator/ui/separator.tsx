import { Separator } from "@/shared/ui/separator";

export const SeparatorBlockUi = ({
  styleVars,
}: {
  styleVars: Record<string, string>;
}) => {
  return (
    <div className="w-full min-w-full">
      <Separator style={styleVars} className="puck-dim" />
    </div>
  );
};
