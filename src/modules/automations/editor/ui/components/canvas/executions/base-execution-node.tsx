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

interface BaseExecutionNodeProps extends NodeProps {
  icon: LucideIcon | string;
  name: string;
  description?: string;
  children?: ReactNode;
  status?: NodeStatus;
  onSettings?: () => void;
  onDoubleClick?: () => void;
}

/**
 * Shared canvas body for execution (action) nodes. An execution sits between a
 * trigger and the rest of the flow, so it exposes both an incoming target
 * handle (left) and an outgoing source handle (right), plus a settings tool
 * opening the configuration panel registered for its type.
 */
export const BaseExecutionNode = memo(
  ({
    id,
    icon: Icon,
    name,
    description,
    status = "initial",
    children,
    onSettings,
    onDoubleClick,
  }: BaseExecutionNodeProps) => {
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
        <NodeStatusIndicator status={status} variant="border">
          <BaseNode status={status} onDoubleClick={onDoubleClick}>
            <BaseNodeContent>
              {typeof Icon === "string" ? (
                <Image src={Icon} alt={name} width={16} height={16} />
              ) : (
                <Icon className="size-4 text-muted-foreground" />
              )}
              {children}
              <BaseHandle
                id="main"
                type="target"
                position={Position.Left}
              />
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

BaseExecutionNode.displayName = "BaseExecutionNode";
