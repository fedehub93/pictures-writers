import { Label } from "@/shared/ui/label";

import { cn } from "@/shared/lib/utils";

import { type FormLayoutInstance } from "../../../types";

import { DesignerNodeWrapper } from "../../canvas/designer-node-wrapper";

export const DesignerComponent = ({
  elementInstance,
  ref,
  isDropTarget,
}: {
  elementInstance: FormLayoutInstance<"Grid">;
  ref: (element: Element | null) => void;
  isDropTarget: boolean;
}) => {
  const { id, children, properties } = elementInstance;
  const { label, column, gap } = properties;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label>{label}</Label>
      <div
        className={cn(
          "max-w-230 h-full m-0 rounded flex flex-col grow items-center justify-start flex-1 overflow-y-auto transition-all",
          isDropTarget && "ring-2 ring-primary/20",
        )}
      >
        {!isDropTarget && children.length === 0 && (
          <p className="text-3xl text-muted-foreground flex grow items-center font-bold">
            Drop here
          </p>
        )}

        {children.length > 0 && (
          <div
            className={cn(
              "flex flex-col w-full gap-2 p-4",
              // area === DropAreaZone.GRID && "flex-row flex-1",
            )}
          >
            {children.map((node, index) => (
              <DesignerNodeWrapper
                key={node.id}
                node={node}
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
  );
};
