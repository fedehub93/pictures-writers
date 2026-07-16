import { useSortable } from "@dnd-kit/react/sortable";
import { CollisionPriority } from "@dnd-kit/abstract";
import { shapeIntersection } from "@dnd-kit/collision";
import { MouseEvent } from "react";

import { GripIcon, XIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";

import {
  DropAreaZone,
  DesignerWrapperData,
  type FormNodeDynamicInstance,
} from "../../types";

import { FormNodes } from "../../registry";

import { useDesigner } from "../../store/use-designer-store";

interface DesignerWrapperProps {
  index: number;
  type: string;
  group: string;
  node: FormNodeDynamicInstance;
}

export const DesignerWrapper = ({
  node,
  type,
  group,
  index,
}: DesignerWrapperProps) => {
  const { removeNodeById, activeNodeId, setActiveNodeId } = useDesigner();
  const { ref: sortableRef, handleRef } = useSortable<DesignerWrapperData>({
    id: node.id,
    index,
    type,
    group,
    accept: (source) => {
      const canAcceptColumn = source.type === "layout" && group === "root";
      const canAcceptItem =
        source.type === "element" && !source.data.isDesignerBtnElement;
      return canAcceptColumn || canAcceptItem;
    },
    data: {
      id: node.id,
      isDesignerBtnElement: false,
      type: node.type,
      area: DropAreaZone.GRID,
    },
    collisionDetector: shapeIntersection,
    collisionPriority: CollisionPriority.High,
  });

  const DesignerNode = FormNodes[node.type].designerComponent as React.FC<{
    elementInstance: FormNodeDynamicInstance;
  }>;

  const onRemoveNode = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    removeNodeById(node.id);
  };

  const onWrapperClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setActiveNodeId(node.id);
  };

  return (
    <div
      ref={sortableRef}
      className="flex flex-col p-4 px-8 w-full"
      onClick={onWrapperClick}
    >
      <div className="flex justify-center group">
        <div className="flex gap-x-4 rounded-t py-1.5 px-3 bg-accent hover:scale-103 transition-all duration-300">
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
          "flex gap-4 w-full  items-center rounded bg-accent/40 px-4 py-4 shadow border-l-3 transition-all duration-300",
          activeNodeId === node.id && "border-l-primary",
        )}
      >
        <div className="flex flex-col gap-2 w-full">
          <DesignerNode elementInstance={node} />
        </div>
      </div>
    </div>
  );
};
