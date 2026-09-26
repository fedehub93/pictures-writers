import { NodeTypes } from "@xyflow/react";

import { ActionNode } from "../ui/components/canvas/action-node";
import { InitialNode } from "../ui/components/canvas/initial-node";
import { TriggerNode } from "../ui/components/canvas/trigger-node";

export const nodeComponents = {
  INITIAL: InitialNode,
  MANUAL_TRIGGER: TriggerNode,
  CRON_TRIGGER: TriggerNode,
  WEBHOOK_TRIGGER: TriggerNode,
  HTTP_REQUEST: ActionNode,
  SEND_EMAIL: ActionNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
