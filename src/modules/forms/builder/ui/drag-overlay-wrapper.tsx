import { DragOverlay, useDragDropMonitor } from "@dnd-kit/react";

import type { LayoutsType, ElementsType } from "../types";
import { FormNodes } from "../registry";

import { SidebarBtnElementDragOverlay } from "./sidebar/sidebar-btn-element-drag-overlay";

export const DragOverlayWrapper = () => {
  useDragDropMonitor({
    onDragStart: (event) => {
      console.log("DRAG ITEM", event);
    },
  });

  let node = <div>No drag overlay</div>;

  // const getSource = (source: Draggable) => {
  //   console.log(source.data)
  //   if (source.data?.isDesignerBtnElement) {
  //     const type = source.data?.type as NodesType;
  //     node = <SidebarBtnElementDragOverlay formNode={FormNodes[type]} />;
  //   }
  //   return node;
  // };

  // return <DragOverlay>{getSource}</DragOverlay>;

  return (
    <DragOverlay>
      {(source) => {
        if (source.data?.isDesignerBtnElement) {
          const type = source.data?.type as ElementsType | LayoutsType;
          return <SidebarBtnElementDragOverlay formNode={FormNodes[type]} />;
        }
      }}
    </DragOverlay>
  );
};
