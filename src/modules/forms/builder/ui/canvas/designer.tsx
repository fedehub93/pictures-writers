"use client";

import { DragEndEvent, useDragDropMonitor } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { CollisionPriority } from "@dnd-kit/abstract";
import { pointerIntersection } from "@dnd-kit/collision";

import { DesignerSidebar } from "../sidebar/designer-sidebar";
import { DropAreaZone, FormNodes, isDragData, isDropData } from "../../types";

import { generateId } from "../../lib/generator";
import { useDesigner } from "../../store/use-designer-store";

import { Droppable } from "./droppable";

export const Designer = () => {
  const { addNode, nodes } = useDesigner();

  useDragDropMonitor({
    onDragEnd: (event: DragEndEvent) => {
      const { source, target } = event.operation;
      if (!source || !target) return;

      if (!isDragData(source.data)) {
        console.error("Dragged datas are incorrect!");
        return;
      }

      const { isDesignerBtnElement, type } = source.data;

      if (isDesignerBtnElement) {
        if (!isDropData(target.data)) {
          console.error("Dropped datas are incorrect!");
          return;
        }

        const { area } = target.data;

        const isAddToRoot =
          isDesignerBtnElement && area === DropAreaZone.DESIGNER;

        if (isAddToRoot) {
          const newElement = FormNodes[type].construct(generateId());
          addNode(newElement);
        }

        if (isDesignerBtnElement && area === DropAreaZone.GRID) {
          const newElement = FormNodes[type].construct(generateId());
          addNode(newElement, undefined, target.data.id);
        }
      }

      if (isSortable(source)) {
        const { initialIndex, index, initialGroup, group } = source;

        console.log(initialIndex, index, initialGroup, group);

        if (initialIndex !== index) {
          // Move items
        }
      }
    },
  });

  return (
    <div className="flex size-full">
      <div className="p-4 w-full">
        <Droppable
          id={"root"}
          area={DropAreaZone.DESIGNER}
          nodes={nodes}
          droppableProps={{
            id: "designer-drop-area",
            collisionPriority: CollisionPriority.Lowest,
            accept: ["element", "layout"],
            collisionDetector: pointerIntersection,
          }}
        />
      </div>
      <DesignerSidebar />
    </div>
  );
};
