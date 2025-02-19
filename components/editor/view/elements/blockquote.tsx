import { cn } from "@/lib/utils";
import { RenderLeaf } from "../helpers/render-leaf";
import { CustomElement } from "../slate-renderer";

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
      {node.children.map((child: any, i: number) => (
        <RenderLeaf key={i} leaf={child} />
      ))}
    </blockquote>
  );
};
