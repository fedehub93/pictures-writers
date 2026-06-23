import { useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";

import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";

import {
  DropAreaZone,
  type DropData,
  type FormLayoutInstance,
} from "../../../types";

export const DesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormLayoutInstance<"Grid">;
}) => {
  const { isDropTarget, ref } = useDroppable<DropData>({
    id: `layout-drop-area-${elementInstance.id}`,
    collisionPriority: CollisionPriority.Highest,
    data: {
      area: DropAreaZone.GRID,
    },
  });
  const { label, column, gap } = elementInstance.properties;
  return (
    <div className="flex flex-col gap-2 w-full">
      <Label>{label}</Label>
      <div
        ref={ref}
        className={cn(
          "bg-background max-w-230 h-full py-6 px-4 rounded flex grow overflow-y-auto",
          !isDropTarget && "border border-dashed",
          isDropTarget && "ring-2 ring-primary/20",
        )}
      >
        {!isDropTarget && (
          <p className="text-3xl text-muted-foreground flex grow items-center font-bold">
            Drop here
          </p>
        )}
      </div>
    </div>
  );
};
