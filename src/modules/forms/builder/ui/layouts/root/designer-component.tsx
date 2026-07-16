import { useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
import { pointerIntersection } from "@dnd-kit/collision";

import { cn } from "@/shared/lib/utils";

import {
  DropAreaZone,
  type FormNodeDynamicInstance,
  GenericData,
} from "../../../types";

import { useDesigner } from "../../../store/designer-provider";

import { DesignerWrapper } from "../../canvas/designer-wrapper";

interface RootProps {
  nodes: FormNodeDynamicInstance[];
}

export const Root = (props: RootProps) => {
  const { nodes } = props;

  const { ref, isDropTarget } = useDroppable<GenericData>({
    id: "root",
    type: "root",
    collisionPriority: CollisionPriority.Lowest,
    collisionDetector: pointerIntersection,
    data: {
      id: "root",
      area: DropAreaZone.ROOT,
    },
  });

  const { activeNodeId } = useDesigner((state) => state);

  return (
    <div ref={ref} className="h-full bg-background p-4">
      <div
        className={cn(
          "w-full h-full  rounded flex flex-col grow items-center justify-start flex-1 overflow-y-auto transition-all m-0",
          isDropTarget && "ring-2 ring-primary/20",
        )}
      >
        {!isDropTarget && nodes.length === 0 && (
          <p className="text-3xl text-muted-foreground flex grow items-center font-bold">
            Drop here
          </p>
        )}

        {nodes.length > 0 && (
          <div className={cn("flex flex-col w-full gap-2 ")}>
            {nodes.map((node, index) => (
              <DesignerWrapper
                key={node.id}
                node={node}
                index={index}
                type={node.isContainer ? "layout" : "element"}
                group="root"
              />
            ))}
          </div>
        )}
        {isDropTarget && !activeNodeId && (
          <div className="p-4 w-full">
            <div className="h-30 rounded bg-primary/20"></div>
          </div>
        )}
      </div>
    </div>
  );
};
