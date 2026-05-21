"use client";

import { useEffect, useState } from "react";

import {
  NodeViewWrapper,
  NodeViewRendererProps,
  NodeViewContent,
} from "@tiptap/react";
import { deleteToC } from "../helpers";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const TableContentBlock = ({
  node,
  editor,
  getPos,
}: NodeViewRendererProps) => {
  const onHandleRemove = () => {
    const p = getPos();
    if (p) {
      deleteToC(editor, p);
    }
  };
  return (
    <NodeViewWrapper>
      <nav
        contentEditable={false}
        className="max-w-md border border-primary/40 bg-accent rounded-md shadow-lg p-4"
        aria-label="Indice dei contenuti"
        role="navigation"
      >
        <details open>
          <summary className="mb-4 w-full flex" >
            <h2 className="font-semibold pointer-events-none text-xl not-prose inline mraut">
              Indice dei contenuti
            </h2>
            <Button
              size="icon"
              variant="destructive"
              className="size-6 ml-auto"
              role="button"
              onClick={onHandleRemove}
            >
              <X />
            </Button>
          </summary>
        </details>
        <NodeViewContent />
      </nav>
    </NodeViewWrapper>
  );
};
