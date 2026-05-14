import { Separator } from "@/components/ui/separator";

export const SeparatorBlockUi = ({
  styleVars,
}: {
  styleVars: Record<string, string>;
}) => {
  return <Separator style={styleVars} className="puck-dim" />;
};
