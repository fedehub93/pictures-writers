import { NodeRendererProps, Tree } from "react-arborist";

import { type FormRootInstance } from "../../types";

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
  return (
    <div className="max-w-60">
      <div
        style={style}
        ref={dragHandle}
        onClick={() => node.toggle()}
        className="line-clamp-1 truncate max-w-full"
      >
        {node.isLeaf ? "🍁" : "🗀"} {node.data.id}
      </div>
    </div>
  );
};
