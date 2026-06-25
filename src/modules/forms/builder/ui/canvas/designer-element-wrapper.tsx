import { useSortable } from "@dnd-kit/react/sortable";

import { GripIcon, XIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { Separator } from "@/shared/ui/separator";
import { Button } from "@/shared/ui/button";

import { DragData, type FormNodeInstance, FormNodes } from "../../types";
import { GROUP_ELEMENT, GROUP_LAYOUT } from "../../constants";
import { useDesigner } from "../../store/use-designer-store";

interface DesignerElementWrapperProps {
  node: FormNodeInstance;
  index: number;
  group: string;
}

export const DesignerElementWrapper = ({
  node,
  index,
  group,
}: DesignerElementWrapperProps) => {
  const { removeNode } = useDesigner();

  const { ref, handleRef, isDragging } = useSortable<DragData>({
    id: node.id,
    index,
    data: {
      type: node.type,
      isDesignerBtnElement: false,
    },
    group,
  });

  const DesignerElement = FormNodes[node.type].designerComponent as React.FC<{
    elementInstance: FormNodeInstance;
  }>;

  const onRemoveNode = () => {
    removeNode(node.id);
  };

  return (
    <div ref={ref} className="flex flex-col p-4 w-full">
      <div className="flex justify-center group">
        <div className="flex gap-x-4 rounded-t py-1.5 px-3 bg-accent hover:scale-103  transition-all duration-300">
          <Button ref={handleRef} variant="outline" size="icon-sm">
            <GripIcon />
          </Button>
          <Button variant="destructive" size="icon-sm" onClick={onRemoveNode}>
            <XIcon />
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "flex gap-4 w-full min-h-30 items-center rounded bg-accent/40 px-4 py-2 border-l-3 border-l-primary shadow transition-all duration-300",
          isDragging && "scale-103 bg-background shadow-xl",
          node.group === GROUP_LAYOUT && 'min-h-100'
        )}
      >
        <div
          className={cn(
            "flex-1",
            node.group === GROUP_ELEMENT && "pointer-events-none ",
          )}
        >
          <DesignerElement elementInstance={node} />
        </div>
      </div>
    </div>
  );
};
