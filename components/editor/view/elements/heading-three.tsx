import { cn } from "@/lib/utils";
import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

export const HeadingThreeElement = ({ node }: { node: CustomElement }) => {
  return (
    <h3
      className={cn(
        node.align === "left" && "text-left",
        node.align === "center" && "text-center",
        node.align === "right" && "text-right"
      )}
    >
      {node.children.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))}
    </h3>
  );
};
