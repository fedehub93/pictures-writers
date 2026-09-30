"use client";

import { Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { memo, type ReactNode } from "react";

import { AutomationNode } from "../automation-node";
import { BaseHandle } from "../base-handle";
import { BaseNode, BaseNodeContent } from "../base-node";
import {
  type NodeStatus,
  NodeStatusIndicator,
} from "../node-status-indicator";

interface BaseTriggerNodeProps extends NodeProps {
  icon: LucideIcon | string;
  name: string;
  description?: string;
  children?: ReactNode;
  status?: NodeStatus;
  onSettings?: () => void;
  onDoubleClick?: () => void;
}

/**
 * Shared canvas body for trigger nodes. Triggers start a Run, so they expose a
 * source handle only (on the right, into the flow) and carry a settings tool
 * opening the configuration panel registered for their type.
 */
export const BaseTriggerNode = memo(
  ({
    id,
    icon: Icon,
    name,
    description,
    children,
    status = "initial",
    onSettings,
    onDoubleClick,
  }: BaseTriggerNodeProps) => {
    const { deleteElements } = useReactFlow();

    const handleDelete = () => {
      void deleteElements({ nodes: [{ id }] });
    };

    return (
      <AutomationNode
        name={name}
        description={description}
        onDelete={handleDelete}
        onSettings={onSettings}
      >
        <NodeStatusIndicator
          status={status}
          variant="border"
          className="rounded-l-2xl"
        >
          <BaseNode
            status={status}
            onDoubleClick={onDoubleClick}
            className="rounded-l-2xl group relative"
          >
            <BaseNodeContent>
              {typeof Icon === "string" ? (
                <Image src={Icon} alt={name} width={16} height={16} />
              ) : (
                <Icon className="size-4 text-muted-foreground" />
              )}
              {children}
              <BaseHandle
                id="main"
                type="source"
                position={Position.Right}
              />
            </BaseNodeContent>
          </BaseNode>
        </NodeStatusIndicator>
      </AutomationNode>
    );
  },
);

BaseTriggerNode.displayName = "BaseTriggerNode";
