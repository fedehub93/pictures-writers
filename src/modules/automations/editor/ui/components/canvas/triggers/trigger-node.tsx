"use client";

import { type NodeProps } from "@xyflow/react";
import { useSetAtom } from "jotai";
import { memo } from "react";

import { findCatalogEntry } from "../../../../config/node-catalog";
import { getNodeIcon } from "../../../../config/node-icons";
import { selectedNodeIdAtom } from "../../../../store/atoms";
import { BaseTriggerNode } from "./base-trigger-node";

/**
 * Generic canvas rendering for trigger nodes. Resolves the catalogue metadata
 * (label, description, icon) for the node's type and delegates rendering to
 * {@link BaseTriggerNode}.
 */
export const TriggerNode = memo((props: NodeProps) => {
  const setSelectedNodeId = useSetAtom(selectedNodeIdAtom);
  const entry = findCatalogEntry(props.type);

  const handleOpenSettings = () => setSelectedNodeId(props.id);

  return (
    <BaseTriggerNode
      {...props}
      icon={getNodeIcon(props.type)}
      name={entry?.label ?? props.type ?? "Trigger"}
      description={entry?.description}
      onSettings={handleOpenSettings}
      onDoubleClick={handleOpenSettings}
    />
  );
});

TriggerNode.displayName = "TriggerNode";
