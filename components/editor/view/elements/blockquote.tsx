import { cn } from "@/lib/utils";
import { RenderLeaf } from "../helpers/render-leaf";
import { CustomElement, isCustomText } from "../slate-renderer";
import { RenderNode } from "../helpers/render-node";

interface BlockquoteProps {
  node: CustomElement;
}

export const BlockquoteElement = ({ node }: BlockquoteProps) => {
  return (
    <blockquote
      className={cn(
        "mb-8 border-l-4 border-l-neutral-800 bg-white p-4 pl-8 shadow-md [&>p]:mb-0",
        node.align === "left" && "text-left",
        node.align === "center" && "text-center",
        node.align === "right" && "text-right"
      )}
    >
      {node.children.map((child: any, i: number) => {
        if (isCustomText(child)) {
          return <RenderLeaf key={i} leaf={child} />;
        }

        return <RenderNode key={i} node={child} />;
      })}
    </blockquote>
  );
};
