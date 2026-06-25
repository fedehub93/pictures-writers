import { CollisionPriority } from "@dnd-kit/abstract";
import { pointerIntersection } from "@dnd-kit/collision";

import { Label } from "@/shared/ui/label";

import { DropAreaZone, type FormLayoutInstance } from "../../../types";
import { Droppable } from "../../canvas/droppable";

export const DesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormLayoutInstance<"Grid">;
}) => {
  const { id, children, properties } = elementInstance;
  const { label, column, gap } = properties;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label>{label}</Label>
      <Droppable
        id={id}
        nodes={children}
        area={DropAreaZone.GRID}
        droppableProps={{
          id: `layout-drop-area-${id}`,
          collisionPriority: CollisionPriority.Highest,
          accept: "element",
          collisionDetector: pointerIntersection
        }}
      />
    </div>
  );
};
