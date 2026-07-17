import { Separator } from "@/shared/ui/separator";

import { FormElements, FormLayouts } from "../../registry";

import { SidebarBtnElement } from "./sidebar-btn-element";

export const SidebarNodes = () => {
  return (
    <div className="flex flex-col p-2 gap-y-4">
      <div className="flex justify-between items-center h-8">
        <p className="text-sm text-foreground">Components</p>
      </div>
      <div className="flex flex-col space-y-2">
        <p className="text-sm font-medium">Layout</p>
        <div className="flex">
          <SidebarBtnElement formNode={FormLayouts.Grid} />
        </div>
      </div>
      <Separator />
      <div className="flex flex-col space-y-2">
        <p className="text-sm font-medium">Elements</p>
        <div className="flex gap-x-4">
          <SidebarBtnElement formNode={FormElements.TextField} />
          <SidebarBtnElement formNode={FormElements.TextareaField} />
        </div>
      </div>
    </div>
  );
};
