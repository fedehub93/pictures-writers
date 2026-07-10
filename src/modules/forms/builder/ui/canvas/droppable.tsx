import { useDroppable, type UseDroppableInput } from "@dnd-kit/react";

import {
  type DropData,
  type FormNodeDynamicInstance,
  DropAreaZone,
} from "../../types";

import { SortableContainer } from "./sortable-container";

interface BaseDroppable {
  nodes: FormNodeDynamicInstance[];
  droppableProps: UseDroppableInput;
}

interface DroppableDesigner extends BaseDroppable {
  id: string;
  area: DropAreaZone.ROOT;
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

  const isDesignerDroppable = area === DropAreaZone.ROOT;

  return (
    <div ref={ref} className="h-full bg-background">
      <SortableContainer
        groupId={id}
        nodes={nodes}
        isDropTarget={isDropTarget}
        isDesignerDroppable={isDesignerDroppable}
      />
    </div>
  );
};
