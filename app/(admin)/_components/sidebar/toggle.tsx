"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/store/use-sidebar";
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";

export const Toggle = () => {
  const { collapsed, onExpand, onCollapse } = useSidebar((state) => state);

  return (
    <>
      {collapsed && (
        <div className="flex w-full items-center justify-center pt-4 mb-4">
          <Button onClick={onExpand} className="h-auto p-2" variant="ghost">
            <ArrowRightFromLine className="h-4 w-4" />
          </Button>
        </div>
      )}
      {!collapsed && (
        <div className="p-3 pl-6 mb-2 flex items-center font-medium w-full">
          <p>Management</p>
          <Button
            onClick={onCollapse}
            className="h-auto p-2 ml-auto"
            variant="ghost"
          >
            <ArrowLeftFromLine className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
};
