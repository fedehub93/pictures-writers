"use client";

import { Separator } from "@/shared/ui/separator";
import { FormElements, FormLayouts } from "../../types";
import { SidebarBtnElement } from "./sidebar-btn-element";

export const DesignerSidebar = () => {
  return (
    <aside className="w-100 max-w-100 flex flex-col grow gap-2 border-l border-muted p-4 bg-background overflow-y-auto h-full">
      <div>
        Layout
        <SidebarBtnElement formNode={FormLayouts.Grid} />
      </div>
      <Separator />
      <div>
        Elements
        <SidebarBtnElement formNode={FormElements.TextField} />
      </div>
    </aside>
  );
};
