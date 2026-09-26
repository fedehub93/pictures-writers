"use client";

import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import React, { useCallback } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Separator } from "@/shared/ui/separator";
import {
  editorActionNodes,
  editorTriggerNodes,
} from "@/modules/automations/editor/config/node-catalog";
import { NodeIcon } from "@/modules/automations/editor/config/node-icon";
import { INITIAL_NODE_TYPE } from "@/modules/automations/constants";
import type { AutomationNodeCatalogEntry } from "@/modules/automations/lib/node-catalog";

function NodeOption({
  entry,
  onSelect,
}: {
  entry: AutomationNodeCatalogEntry;
  onSelect: (entry: AutomationNodeCatalogEntry) => void;
}) {
  return (
    <div
      className="w-full justify-start h-auto py-5 px-4 rounded-none cursor-pointer border-l-2 border-transparent hover:border-l-primary"
      onClick={() => onSelect(entry)}
    >
      <div className="flex items-center gap-6 w-full overflow-hidden">
        <NodeIcon type={entry.type} className="size-5" />
        <div className="flex flex-col items-start text-left">
          <span className="font-medium text-sm">{entry.label}</span>
          <span className="text-xs text-muted-foreground">
            {entry.description}
          </span>
        </div>
      </div>
    </div>
  );
}

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();
  const handleNodeSelect = useCallback(
    (selection: AutomationNodeCatalogEntry) => {
      if (selection.type === "MANUAL_TRIGGER") {
        const nodes = getNodes();
        const hasManualTrigger = nodes.some(
          (node) => node.type === "MANUAL_TRIGGER",
        );
        if (hasManualTrigger) {
          toast.error("Only one manual trigger is allowed per workflow");
          return;
        }
      }

      setNodes((nodes) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const flowPosition = screenToFlowPosition({
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
        });

        const newNode = {
          id: createId(),
          data: {},
          position: flowPosition,
          type: selection.type,
        };

        // The INITIAL node is a placeholder launch pad: picking any node
        // converts it into the chosen node instead of stacking a placeholder
        // next to it. All other, already-authored nodes are preserved.
        const rest = nodes.filter((node) => node.type !== INITIAL_NODE_TYPE);
        return [...rest, newNode];
      });

      onOpenChange(false);
    },
    [setNodes, getNodes, onOpenChange, screenToFlowPosition],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>What triggers this workflow?</SheetTitle>
          <SheetDescription>
            A trigger is a step that starts your workflow.
          </SheetDescription>
        </SheetHeader>
        <div>
          {editorTriggerNodes.map((entry) => (
            <NodeOption key={entry.type} entry={entry} onSelect={handleNodeSelect} />
          ))}
        </div>
        <Separator />
        <div>
          {editorActionNodes.map((entry) => (
            <NodeOption key={entry.type} entry={entry} onSelect={handleNodeSelect} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
