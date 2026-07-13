import { XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useDesigner } from "../../store/use-designer-store";
import { findNodeRecursively } from "../../helpers";
import { type FormNodeDynamicInstance, FormNodes } from "../../types";

export const SidebarNodeProperties = () => {
  const { activeNodeId, setActiveNodeId } = useDesigner();

  const node = useDesigner((state) =>
    findNodeRecursively(state.root, activeNodeId),
  );

  if (!node || node.type === "Root") return null;

  const PropertiesForm = FormNodes[node.type].propertiesComponent as React.FC<{
    elementInstance: FormNodeDynamicInstance;
  }>;

  const onClose = () => {
    setActiveNodeId(null);
  };

  return (
    <div className="flex flex-col p-2 gap-y-4">
      <div className="flex justify-between items-center h-8">
        <p className="text-sm text-foreground">Element properties</p>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <XIcon className="size-4" />
        </Button>
      </div>
      <PropertiesForm elementInstance={node} />
    </div>
  );
};
