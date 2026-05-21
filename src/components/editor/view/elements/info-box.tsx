"use client";

import { cn } from "@/lib/utils";
import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

interface InfoBoxProps {
  node: CustomElement;
}

export const InfoBoxElement = ({ node }: InfoBoxProps) => {
  return (
    <div
      className={cn(
        "post__info-box",
        node.align === "left" && "text-left",
        node.align === "center" && "text-center",
        node.align === "right" && "text-right"
      )}
    >
      <div className="post__info-box-icon">{node.data.icon}</div>

      {node.children.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))}
    </div>
  );
};
