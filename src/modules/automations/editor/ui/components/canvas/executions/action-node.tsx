"use client";

import { type NodeProps } from "@xyflow/react";
import { useSetAtom } from "jotai";
import { memo } from "react";

import { findCatalogEntry } from "../../../../config/node-catalog";
import { getNodeIcon } from "../../../../config/node-icons";
import { selectedNodeIdAtom } from "../../../../store/atoms";
import { BaseExecutionNode } from "./base-execution-node";

/**
 * Generic canvas rendering for execution (action) nodes. Resolves the
 * catalogue metadata (label, description, icon) for the node's type and
 * delegates rendering to {@link BaseExecutionNode}.
 */
export const ActionNode = memo((props: NodeProps) => {
  const setSelectedNodeId = useSetAtom(selectedNodeIdAtom);
  const entry = findCatalogEntry(props.type);

  const handleOpenSettings = () => setSelectedNodeId(props.id);

  return (
    <BaseExecutionNode
      {...props}
      icon={getNodeIcon(props.type)}
      name={entry?.label ?? props.type ?? "Action"}
      description={entry?.description}
      onSettings={handleOpenSettings}
      onDoubleClick={handleOpenSettings}
    />
  );
});

ActionNode.displayName = "ActionNode";
