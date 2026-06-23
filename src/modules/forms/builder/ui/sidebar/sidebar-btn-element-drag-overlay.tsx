import { Button } from "@/shared/ui/button";

import { type FormNode } from "../../types";

export const SidebarBtnElementDragOverlay = ({
  formNode,
}: {
  formNode: FormNode;
}) => {
  const { icon: Icon, label } = formNode.designerBtnElement;

  return (
    <Button
      variant="outline"
      className="flex flex-col gap-2 size-30 cursor-grab"
    >
      <Icon className="size-8 text-primary cursor-grab" />
      <p className="text-xs">{label}</p>
    </Button>
  );
};
