import { cn } from "@/shared/lib/utils";

import { type FormNodeDynamicInstance } from "../../types";

import { DesignerNodeWrapper } from "./designer-node-wrapper";
import { DesignerLayoutWrapper } from "./designer-layout-wrapper";
import { useDesigner } from "../../store/use-designer-store";

interface SortableContainerProps {
  groupId: string;
  nodes: FormNodeDynamicInstance[];
  isDropTarget: boolean;
  isDesignerDroppable: boolean;
}

export const SortableContainer = ({
  groupId,
  nodes,
  isDropTarget,
  isDesignerDroppable,
}: SortableContainerProps) => {
  const { activeNodeId } = useDesigner();

  return (
    <div
      className={cn(
        "w-full h-full m-auto rounded flex flex-col grow items-center justify-start flex-1 overflow-y-auto transition-all",
        isDropTarget && "ring-2 ring-primary/20",
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
            // area === DropAreaZone.GRID && "flex-row flex-1",
          )}
        >
          {nodes.map((node, index) =>
            node.group === "layout" ? (
              <DesignerLayoutWrapper
                key={node.id}
                node={node}
                index={index}
                group={groupId}
              />
            ) : (
              <DesignerNodeWrapper
                key={node.id}
                node={node}
                index={index}
                group={groupId}
              />
            ),
          )}
        </div>
      )}
      {isDropTarget && !activeNodeId && (
        <div className="p-4 w-full">
          <div className="h-30 rounded bg-primary/20"></div>
        </div>
      )}
    </div>
  );
};
