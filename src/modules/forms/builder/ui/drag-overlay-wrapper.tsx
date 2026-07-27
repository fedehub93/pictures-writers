import { DragOverlay, useDragDropMonitor } from "@dnd-kit/react";

import type { LayoutsType, ElementsType } from "../types/core";
import { FormNodes } from "../registry";

import { SidebarBtnElementDragOverlay } from "./sidebar/sidebar-btn-element-drag-overlay";

export const DragOverlayWrapper = () => {
  useDragDropMonitor({
    onDragStart: (event) => {
      console.log("DRAG ITEM", event);
    },
  });

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
