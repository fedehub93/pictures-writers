"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { useSetAtom } from "jotai";
import { memo } from "react";

import { findCatalogEntry } from "../../../config/node-catalog";
import { NodeIcon } from "../../../config/node-icon";
import { selectedNodeIdAtom } from "../../../store/atoms";
import { AutomationNode } from "./automation-node";
import { BaseNode } from "./base-node";

/**
 * Generic canvas rendering for action nodes. It shows the node's label and a
 * settings tool, which opens the configuration panel registered for its type.
 */
export const ActionNode = memo(({ id, type }: NodeProps) => {
  const setSelectedNodeId = useSetAtom(selectedNodeIdAtom);
  const { deleteElements } = useReactFlow();
  const entry = findCatalogEntry(type);

  return (
    <AutomationNode
      showToolbar
      onSettings={() => setSelectedNodeId(id)}
      onDelete={() => {
        void deleteElements({ nodes: [{ id }] });
      }}
    >
      <BaseNode className="min-w-40 px-3 py-2">
        <div className="flex items-center gap-2">
          <NodeIcon type={type} className="size-4" />
          <span className="font-medium text-sm">
            {entry?.label ?? type}
          </span>
        </div>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </BaseNode>
    </AutomationNode>
  );
});

ActionNode.displayName = "ActionNode";
