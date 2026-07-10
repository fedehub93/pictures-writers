import { useSortable } from "@dnd-kit/react/sortable";
import { CollisionPriority } from "@dnd-kit/abstract";
import { pointerIntersection } from "@dnd-kit/collision";
import { useDroppable } from "@dnd-kit/react";
import { MouseEvent } from "react";

import { GripIcon, XIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";

import { Button } from "@/shared/ui/button";

import { DropAreaZone, DropData, FormLayoutInstance } from "../../types";
import { useDesigner } from "../../store/use-designer-store";
import { DesignerNodeWrapper } from "./designer-node-wrapper";

interface DesignerLayoutWrapperProps {
  node: FormLayoutInstance;
  index: number;
  group: string;
}

export const DesignerLayoutWrapper = ({
  node,
  index,
  group,
}: DesignerLayoutWrapperProps) => {
  const { removeNodeById, activeNodeId, setActiveNodeId } = useDesigner();

  const { ref: sortableRef, handleRef } = useSortable<DropData>({
    id: node.id,
    index,
    type: "layout",
    accept: ["element", "layout"],
    group: "root",
    data: {
      area: DropAreaZone.GRID,
      id: node.id,
    },
    collisionDetector: pointerIntersection,
    collisionPriority: CollisionPriority.Low,
  });

  const { ref: droppableRef, isDropTarget } = useDroppable<DropData>({
    id: `layout-droppable-node-${node.id}`,
    type: "layout-droppable",
    accept: "element",
    collisionDetector: pointerIntersection,
    collisionPriority: CollisionPriority.High,
    data: {
      area: DropAreaZone.GRID,
      id: node.id,
    },
  });

  const onRemoveNode = () => {
    removeNodeById(node.id);
  };

  const onWrapperClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setActiveNodeId(node.id);
  };

  return (
    <div
      ref={sortableRef}
      className="flex flex-col p-4 w-full"
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
          "flex gap-4 w-full  items-center rounded bg-accent/40 px-4 py-2 shadow border-l-3 transition-all duration-300",
          activeNodeId === node.id && "border-l-primary",
        )}
      >
        <div className="flex flex-col gap-2 w-full">
          <Label>{node.properties.label}</Label>
          <div
            ref={droppableRef}
            className={cn(
              "max-w-230 h-full m-0 rounded flex flex-col grow items-center justify-start flex-1 overflow-y-auto transition-all border border-dashed min-h-40",
              isDropTarget && "ring-2 ring-primary/20",
            )}
          >
            {!isDropTarget && node.children.length === 0 && (
              <p className="text-3xl text-muted-foreground flex grow items-center font-bold">
                Drop here
              </p>
            )}

            {node.children.length > 0 && (
              <div
                className={cn(
                  "flex flex-col w-full gap-2 p-4",
                  // area === DropAreaZone.GRID && "flex-row flex-1",
                )}
              >
                {node.children.map((childNode, index) => (
                  <DesignerNodeWrapper
                    key={childNode.id}
                    node={childNode}
                    index={index}
                    group={node.id}
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
        </div>
      </div>
    </div>
  );
};
