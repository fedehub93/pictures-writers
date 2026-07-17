import { useDraggable } from "@dnd-kit/react";

import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";

import type { DragData, FormNode } from "../../types";

export const SidebarBtnElement = ({ formNode }: { formNode: FormNode }) => {
  const { icon: Icon, label } = formNode.designerBtnElement;

  const { ref, isDragging } = useDraggable<DragData>({
    id: `designer-btn-${formNode.type}`,
    type: formNode.isContainer ? "layout" : "element",
    data: {
      isDesignerBtnElement: true,
      type: formNode.type,
    },
  });

  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "flex flex-col gap-2 size-30 cursor-grab",
        isDragging && "ring-2 ring-primary",
      )}
    >
      <Icon className="size-8 text-primary cursor-grab" />
      <p className="text-xs">{label}</p>
    </Button>
  );
};
