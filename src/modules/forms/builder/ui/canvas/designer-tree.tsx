import { NodeRendererProps, Tree } from "react-arborist";

import type {
  DisplayType,
  ElementsType,
  LayoutsType,
  FormRootInstance,
} from "../../types/core";
import { FormNodes } from "../../registry";

interface DesignerTreeProps {
  root: FormRootInstance;
}

export const DesignerTree = ({ root }: DesignerTreeProps) => {
  return (
    <div className="bg-background rounded p-2">
      <div className="max-w-60">
        <Tree data={root.children} className="max-w-full">
          {TreeNode}
        </Tree>
      </div>
    </div>
  );
};

const TreeNode = ({ node, style, dragHandle }: NodeRendererProps<any>) => {
  const type = node.data.type as ElementsType | LayoutsType | DisplayType;
  const Icon = FormNodes[type].designerBtnElement.icon;

  return (
    <div className="max-w-60 p-4">
      <div
        style={style}
        ref={dragHandle}
        onClick={() => node.toggle()}
        className="line-clamp-1 truncate max-w-full flex gap-x-2 items-center"
      >
        <Icon className="size-5 text-primary" />
        <span className="text-sm">{node.data.properties.label}</span>
      </div>
    </div>
  );
};
