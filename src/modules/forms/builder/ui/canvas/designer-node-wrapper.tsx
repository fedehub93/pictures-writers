import { useSortable } from "@dnd-kit/react/sortable";
import { CollisionPriority } from "@dnd-kit/abstract";

import { GripIcon, XIcon } from "lucide-react";
import { MouseEvent } from "react";

import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";

import { DragData, type FormNodeDynamicInstance, FormNodes } from "../../types";
import { GROUP_ELEMENT, GROUP_LAYOUT } from "../../constants";
import { useDesigner } from "../../store/use-designer-store";

interface DesignerNodeWrapperProps {
  node: FormNodeDynamicInstance;
  index: number;
  group: string;
}

export const DesignerNodeWrapper = ({
  node,
  index,
  group,
}: DesignerNodeWrapperProps) => {
  const { removeNodeById, activeNodeId, setActiveNodeId } = useDesigner();
  const { ref, handleRef, isDragging } = useSortable<DragData>({
    id: node.id,
    index,
    type: "element",
    accept: (source) => {
      const canAcceptColumn = source.type === "layout" && group === "root";
      const canAcceptItem =
        source.type === "element" && !source.data.isDesignerBtnElement;
      return canAcceptColumn || canAcceptItem;
    },
    group,
    collisionPriority: CollisionPriority.Highest,
    data: {
      type: node.type,
      isDesignerBtnElement: false,
    },
  });

  const DesignerNode = FormNodes[node.type].designerComponent as React.FC<{
    elementInstance: FormNodeDynamicInstance;
  }>;

  const onRemoveNode = () => {
    removeNodeById(node.id);
  };

  const onWrapperClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setActiveNodeId(node.id);
  };

  return (
    <div
      ref={ref}
      className="flex flex-col p-4 w-full"
      onClick={onWrapperClick}
    >
      <div className="flex justify-center group">
        <div className="flex gap-x-4 rounded-t py-1.5 px-3 bg-accent hover:scale-103 transition-all duration-150">
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
          "flex gap-4 w-full min-h-30 items-center rounded bg-accent/40 px-4 py-2 border-l-3 shadow transition-all duration-150",
          isDragging && "scale-103 bg-background shadow-xl",
          activeNodeId === node.id && " border-l-primary",
          node.group === GROUP_LAYOUT && "min-h-100",
        )}
      >
        <div
          className={cn(
            "flex-1",
            node.group === GROUP_ELEMENT && "pointer-events-none ",
          )}
        >
          <DesignerNode elementInstance={node} />
        </div>
      </div>
    </div>
  );
};
