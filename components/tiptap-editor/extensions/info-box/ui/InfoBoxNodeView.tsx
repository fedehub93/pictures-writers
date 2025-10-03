"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Node } from "@tiptap/pm/model";

interface InfoBoxRendererProps {
  node: Node;
}

export const InfoBoxRenderer = ({ node }: InfoBoxRendererProps) => {
  const { icon } = node.attrs;

  return (
    <NodeViewWrapper
      className={`relative mb-8 p-4 py-6 pl-12 rounded-lg [&>p]:mb-4 bg-accent`}
    >
      <div>{icon}</div>

      <NodeViewContent className="mt-2" />
    </NodeViewWrapper>
  );
};
