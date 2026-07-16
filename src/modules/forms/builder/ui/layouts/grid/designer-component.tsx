import { useDragOperation, useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
import { pointerIntersection } from "@dnd-kit/collision";

import { Label } from "@/shared/ui/label";

import { cn } from "@/shared/lib/utils";

import {
  DropAreaZone,
  GenericData,
  isDragData,
  type FormLayoutInstance,
} from "../../../types";

import { DesignerWrapper } from "../../canvas/designer-wrapper";

export const GridDesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormLayoutInstance<"Grid">;
}) => {
  const { id, children, properties } = elementInstance;
  const { label, columns, gap } = properties;

  const { ref: droppableRef, isDropTarget } = useDroppable<GenericData>({
    id: `layout-droppable-node-${id}`,
    type: "layout-droppable",
    accept: "element",
    collisionDetector: pointerIntersection,
    collisionPriority: CollisionPriority.High,
    data: {
      area: DropAreaZone.GRID,
      id,
    },
  });

  const { source } = useDragOperation();
  const showPlaceholder =
    isDropTarget &&
    source &&
    isDragData(source.data) &&
    source.data.isDesignerBtnElement;

  return (
    <div ref={droppableRef} className="flex flex-col gap-2 w-full">
      <div
        className={cn(
          "max-w-230 h-full m-0 rounded flex flex-col grow items-center justify-start flex-1 overflow-y-auto transition-all min-h-40",
          isDropTarget && "border-primary",
        )}
      >
        {!isDropTarget && children.length === 0 && (
          <p className="text-3xl text-muted-foreground flex grow items-center font-bold">
            Drop here
          </p>
        )}

        {children.length > 0 && (
          <div
            className={cn("w-full grid")}
            style={{
              gridTemplateColumns: columns
                ? `repeat(${columns}, minmax(0, 1fr))`
                : undefined,
              gap: gap ? `calc(var(--spacing) * ${gap})` : undefined,
            }}
          >
            {children.map((node, index) => (
              <DesignerWrapper
                key={node.id}
                node={node}
                index={index}
                type={node.isContainer ? "layout" : "element"}
                group={id}
              />
            ))}
          </div>
        )}
        {showPlaceholder && (
          <div className="p-4 w-full">
            <div className="h-30 rounded bg-primary/20"></div>
          </div>
        )}
      </div>
    </div>
  );
};
