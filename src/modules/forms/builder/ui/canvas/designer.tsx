"use client";

import { DragEndEvent, useDragDropMonitor, useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";

import { cn } from "@/shared/lib/utils";

import { DesignerSidebar } from "../sidebar/designer-sidebar";
import { useDesigner } from "../../hooks/use-designer";
import {
  DropAreaZone,
  type DropData,
  FormNodes,
  isDragData,
  isDropData,
} from "../../types";
import { generateId } from "../../lib/generator";

import { DesignerElementWrapper } from "./designer-element-wrapper";

export const Designer = () => {
  const { nodes, addNode } = useDesigner();

  const { ref, isDropTarget } = useDroppable<DropData>({
    id: "designer-drop-area",
    data: {
      area: DropAreaZone.DESIGNER,
    },
    collisionPriority: CollisionPriority.Lowest,
  });

  useDragDropMonitor({
    onDragEnd: (event: DragEndEvent) => {
      const { source, target } = event.operation;
      if (!source || !target) return;

      if (!isDropData(target.data) || !isDragData(source.data)) {
        console.error("Dragged datas are incorrect!");
        return;
      }

      const { isDesignerBtnElement, type } = source.data;
      const { area } = target.data;

      if (isDesignerBtnElement && area === DropAreaZone.DESIGNER) {
        const newElement = FormNodes[type].construct(generateId());
        addNode(0, newElement);
      }
    },
  });

  return (
    <div className="flex size-full">
      <div className="p-4 w-full">
        <div
          ref={ref}
          className={cn(
            "bg-background max-w-230 h-full m-auto rounded flex flex-col grow items-center justify-start flex-1 overflow-y-auto",
            isDropTarget && "ring-2 ring-primary/20",
          )}
        >
          {!isDropTarget && nodes.length === 0 && (
            <p className="text-3xl text-muted-foreground flex grow items-center font-bold">
              Drop here
            </p>
          )}
          {isDropTarget && (
            <div className="p-4 w-full">
              <div className="h-30 rounded bg-primary/20"></div>
            </div>
          )}
          {nodes.length > 0 && (
            <div className="flex flex-col w-full gap-2 p-4">
              {nodes.map((node) => (
                <DesignerElementWrapper key={node.id} node={node} />
              ))}
            </div>
          )}
        </div>
      </div>
      <DesignerSidebar />
    </div>
  );
};
