"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { useSetAtom } from "jotai";

import { findCatalogEntry } from "../../../config/node-catalog";
import { NodeIcon } from "../../../config/node-icon";
import { selectedNodeIdAtom } from "../../../store/atoms";
import { AutomationNode } from "./automation-node";
import { BaseNode } from "./base-node";

export interface NodeShellProps extends NodeProps {
  /** Actions receive an incoming token; triggers only emit one. */
  showTargetHandle?: boolean;
}

/**
 * Shared canvas body for a trigger or action node: label, settings/delete
 * toolbar, a bottom source handle and (for actions) a top target handle.
 */
export function NodeShell({ id, type, showTargetHandle }: NodeShellProps) {
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
          <span className="font-medium text-sm">{entry?.label ?? type}</span>
        </div>
        {showTargetHandle ? (
          <Handle id="main" type="target" position={Position.Top} />
        ) : null}
        <Handle id="main" type="source" position={Position.Bottom} />
      </BaseNode>
    </AutomationNode>
  );
}
