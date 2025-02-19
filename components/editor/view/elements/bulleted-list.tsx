import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

interface BulletedListProps {
  node: CustomElement;
}

export const BulletedListElement = ({ node }: BulletedListProps) => {
  return (
    <ul className="list-disc px-4 mb-4">
      {node.children.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))}
    </ul>
  );
};
