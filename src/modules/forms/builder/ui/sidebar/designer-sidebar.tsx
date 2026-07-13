"use client";

import { useDesigner } from "../../store/use-designer-store";

import { SidebarNodes } from "./sidebar-nodes";
import { SidebarNodeProperties } from "./sidebar-node-properties";

export const DesignerSidebar = () => {
  const { activeNodeId } = useDesigner();
  return (
    <aside className="w-100 max-w-100 border-l border-muted p-4 bg-background overflow-y-auto h-full rounded">
      {!activeNodeId && <SidebarNodes />}
      {activeNodeId && <SidebarNodeProperties />}
    </aside>
  );
};
