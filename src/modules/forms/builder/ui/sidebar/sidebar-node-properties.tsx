import { Suspense } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";

import type { FormNodeInstance, PropertiesComponent } from "../../types/core";
import { useDesigner } from "../../store/designer-provider";
import { findNodeRecursively } from "../../helpers";
import { FormNodes } from "../../registry";

export const SidebarNodeProperties = () => {
  const { activeNodeId, setActiveNodeId } = useDesigner((state) => state);

  const node = useDesigner((state) =>
    findNodeRecursively(state.root, activeNodeId),
  );

  if (!node) return null;

  const PropertiesForm = FormNodes[node.type]
    .propertiesComponent as PropertiesComponent<FormNodeInstance>;

  const onClose = () => {
    setActiveNodeId(null);
  };

  return (
    <div className="flex flex-col p-2 gap-y-4">
      <div className="flex justify-between items-center h-8">
        <p className="text-sm text-foreground">
          {node.isContainer ? "Layout" : "Field"} properties
        </p>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <XIcon className="size-4" />
        </Button>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading properties...</p>}>
        <PropertiesForm key={node.id} elementInstance={node} />
      </Suspense>
    </div>
  );
};
