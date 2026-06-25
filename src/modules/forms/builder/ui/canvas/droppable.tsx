import { useDroppable, type UseDroppableInput } from "@dnd-kit/react";

import { cn } from "@/shared/lib/utils";

import {
  type DropData,
  type FormNodeInstance,
  DropAreaZone,
} from "../../types";
import { DesignerElementWrapper } from "./designer-element-wrapper";

interface BaseDroppable {
  nodes: FormNodeInstance[];
  droppableProps: UseDroppableInput;
}

interface DroppableDesigner extends BaseDroppable {
  id: string;
  area: DropAreaZone.DESIGNER;
}

interface DroppableLayout extends BaseDroppable {
  id: string;
  area: DropAreaZone.GRID;
}

type DroppableProps = DroppableDesigner | DroppableLayout;

export const Droppable = (props: DroppableProps) => {
  const { id, nodes, droppableProps, area } = props;

  const { ref, isDropTarget } = useDroppable<DropData>({
    ...droppableProps,
    data: {
      area,
      id,
    },
  });

  const isDesignerDroppable = area === DropAreaZone.DESIGNER;

  return (
    <div
      ref={ref}
      className={cn(
        "max-w-230 h-full m-auto rounded flex flex-col grow items-center justify-start flex-1 overflow-y-auto transition-all",
        isDropTarget && "ring-2 ring-primary/20",
        isDesignerDroppable && "bg-background",
        !isDesignerDroppable && "m-0",
      )}
    >
      {!isDropTarget && nodes.length === 0 && (
        <p className="text-3xl text-muted-foreground flex grow items-center font-bold">
          Drop here
        </p>
      )}

      {nodes.length > 0 && (
        <div
          className={cn(
            "flex flex-col w-full gap-2 p-4",
            area === DropAreaZone.GRID && "flex-row flex-1",
          )}
        >
          {nodes.map((node, index) => (
            <DesignerElementWrapper
              key={node.id}
              node={node}
              index={index}
              group={id}
            />
          ))}
        </div>
      )}
      {isDropTarget && (
        <div className="p-4 w-full">
          <div className="h-30 rounded bg-primary/20"></div>
        </div>
      )}
    </div>
  );
};
