import { useDroppable } from "@dnd-kit/react";
import { type FormNodeInstance, FormNodes } from "../../types";

interface DesignerElementWrapperProps {
  node: FormNodeInstance;
}

export const DesignerElementWrapper = ({
  node,
}: DesignerElementWrapperProps) => {
  const topHalf = useDroppable({
    id: node.id + "top",
  });

  const DesignerElement = FormNodes[node.type].designerComponent as React.FC<{
    elementInstance: FormNodeInstance;
  }>;
  return (
    <div className="flex w-full min-h-30 items-center rounded bg-accent/40 px-4 py-2 pointer-events-none">
      <DesignerElement elementInstance={node} />
    </div>
  );
};
