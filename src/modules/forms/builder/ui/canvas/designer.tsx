"use client";

import {
  type DragEndEvent,
  type DragOverEvent,
  useDragDropMonitor,
} from "@dnd-kit/react";

import { isSortable } from "@dnd-kit/react/sortable";

import { MouseEvent } from "react";

import { cn } from "@/shared/lib/utils";

import { DesignerSidebar } from "../sidebar/designer-sidebar";
import {
  DropAreaZone,
  FormNodes,
  isDragData,
  isGenericData,
} from "../../types";

import { generateId } from "../../lib/generator";
import { useDesigner } from "../../store/use-designer-store";

import { DesignerTree } from "./designer-tree";
import { Root } from "../layouts/root/designer-component";

export const Designer = () => {
  const {
    root,
    addNode,
    activeNodeId,
    setActiveNodeId,
    moveNodeToContainer,
    moveNodeInTree,
  } = useDesigner();

  useDragDropMonitor({
    onDragOver: (event: DragOverEvent) => {
      const { source, target } = event.operation;

      if (!source || !target || source.id === target.id) return;

      if (isDragData(source.data)) {
        if (source.data.isDesignerBtnElement) {
          setActiveNodeId(null);
        }
      }

      if (!isSortable(source) || source.type !== "element") return;

      setActiveNodeId(String(source.id));

      const sourceContainer =
        source.group !== undefined && source.group !== null
          ? source.group
          : "root";

      let targetContainer = "root";

      if (target.type === "layout-droppable") {
        targetContainer = String(target.id).replace(
          "layout-droppable-node-",
          "",
        );
      } else if (
        isSortable(target) &&
        target.group !== undefined &&
        target.group !== null
      ) {
        targetContainer = String(target.group);
      }

      if (sourceContainer !== targetContainer) {
        moveNodeToContainer(String(source.id), targetContainer);
      }
    },
    onDragEnd: (event: DragEndEvent) => {
      if (event.canceled) return;

      const { source, target } = event.operation;

      if (!source || !target) return;
      setActiveNodeId(String(source.id));

      // 1. RIMOSSO il blocco globale: if (source.id === target.id) return;

      // 2. Gestione degli inserimenti dall'esterno (es. Sidebar)
      if (isDragData(source.data)) {
        const { isDesignerBtnElement, type } = source.data;

        if (isDesignerBtnElement) {
          // In questo caso specifico, target e source devono essere diversi
          if (source.id === target.id) return;

          if (!isGenericData(target.data)) {
            console.error("Dropped datas are incorrect!");
            return;
          }

          const { area, id: targetId } = target.data;

          if (area === DropAreaZone.ROOT) {
            const newElement = FormNodes[type].construct(generateId());
            addNode(newElement, undefined, "root");
            setActiveNodeId(newElement.id);
          } else if (
            source.data.type !== "Grid" &&
            area === DropAreaZone.GRID
          ) {
            const newElement = FormNodes[type].construct(generateId());
            addNode(newElement, undefined, targetId ?? "root"); // Fallback di sicurezza
            setActiveNodeId(newElement.id);
          }
        }
      }

      // 3. Gestione del riordinamento (Sortable)
      if (!isSortable(source)) return;

      const { initialIndex, index, initialGroup, group } = source;

      // Verifica se l'elemento è stato effettivamente spostato in una nuova posizione/gruppo
      if (initialIndex === index && initialGroup === group) return;

      moveNodeInTree(
        initialIndex,
        index,
        String(initialGroup) ?? "root",
        String(group) ?? "root",
      );
    },
  });

  const onWrapperClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setActiveNodeId("root");
  };

  return (
    <div className="flex size-full p-4 gap-x-8 justify-center">
      <DesignerTree root={root} />
      <div
        className={cn(
          "w-full max-w-230 border-l-3 rounded transition-all duration-150 overflow-hidden",
          activeNodeId === "root" && "border-l-primary",
        )}
        onClick={onWrapperClick}
      >
        <Root nodes={root.children} />
      </div>
      <DesignerSidebar />
    </div>
  );
};
