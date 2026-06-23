import { DragOverlay, useDragDropMonitor } from "@dnd-kit/react";

import { Draggable } from "@dnd-kit/dom";
import { FormNodes, type NodesType } from "../types";
import { SidebarBtnElementDragOverlay } from "./sidebar/sidebar-btn-element-drag-overlay";

export const DragOverlayWrapper = () => {
  useDragDropMonitor({
    onDragStart: (event) => {
      console.log("DRAG ITEM", event);
    },
  });

  let node = <div>No drag overlay</div>;

  const getSource = (source: Draggable) => {
    if (source.data?.isDesignerBtnElement) {
      const type = source.data?.type as NodesType;
      node = <SidebarBtnElementDragOverlay formNode={FormNodes[type]} />;
    }
    return node;
  };

  return <DragOverlay>{getSource}</DragOverlay>;
};
