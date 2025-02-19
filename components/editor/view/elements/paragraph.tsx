import { cn } from "@/lib/utils";
import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

export const ParagraphElement = ({ node }: { node: CustomElement }) => {
  return (
    <p
      className={
        node.align === undefined
          ? undefined
          : cn(
              node.align === "left" && "text-left",
              node.align === "center" && "text-center",
              node.align === "right" && "text-right"
            )
      }
    >
      {node.children.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))}
    </p>
  );
};
