"use client";

import { NodeViewContent, NodeViewRendererProps } from "@tiptap/react";

import { cn } from "@/lib/utils";

export const InfoBoxNodeView = ({ node }: NodeViewRendererProps) => {
  const { icon } = node.attrs;

  return (
    <div className={cn("post__info-box")}>
      <div className="post__info-box-icon">{icon}</div>
      <NodeViewContent className="mt-2" />
    </div>
  );
};
