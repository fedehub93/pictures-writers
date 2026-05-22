import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

interface ListItemProps {
  node: CustomElement;
}

export const ListItemElement = ({ node }: ListItemProps) => {
  return (
    <li className="list-item mb-2 text-base">
      {node.children.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))}
    </li>
  );
};
