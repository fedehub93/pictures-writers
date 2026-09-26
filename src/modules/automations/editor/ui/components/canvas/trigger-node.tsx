"use client";

import { type NodeProps } from "@xyflow/react";
import { memo } from "react";

import { NodeShell } from "./node-shell";

/**
 * Generic canvas rendering for trigger nodes. Triggers start a Run, so they
 * expose a source handle only and carry a settings tool opening the
 * configuration panel registered for their type.
 */
export const TriggerNode = memo((props: NodeProps) => <NodeShell {...props} />);

TriggerNode.displayName = "TriggerNode";
