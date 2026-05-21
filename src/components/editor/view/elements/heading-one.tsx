import { cn } from "@/lib/utils";
import { RenderNode } from "../helpers/render-node";
import { CustomElement, isCustomText } from "../slate-renderer";

export const HeadingOneElement = ({ node }: { node: CustomElement }) => {
  const id =
    node.children && isCustomText(node.children[0])
      ? node.children[0].text.replace(/[^A-Z0-9]/gi, "_").toLowerCase()
      : "no_id";
  return (
    <h1
      id={id}
      className={cn(
        node.align === "left" && "text-left",
        node.align === "center" && "text-center",
        node.align === "right" && "text-right"
      )}
    >
      {node.children.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))}
    </h1>
  );
};
