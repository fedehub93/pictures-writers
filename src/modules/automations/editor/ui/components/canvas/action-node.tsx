"use client";

import { type NodeProps } from "@xyflow/react";
import { memo } from "react";

import { NodeShell } from "./node-shell";

/**
 * Generic canvas rendering for action nodes: a labeled node with a settings
 * tool that opens the configuration panel registered for its type.
 */
export const ActionNode = memo((props: NodeProps) => (
  <NodeShell {...props} showTargetHandle />
));

ActionNode.displayName = "ActionNode";
