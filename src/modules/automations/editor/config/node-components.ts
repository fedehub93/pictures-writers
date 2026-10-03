import { NodeTypes } from "@xyflow/react";

import { ActionNode } from "../ui/components/canvas/executions/action-node";
import { InitialNode } from "../ui/components/canvas/initial-node";
import { TriggerNode } from "../ui/components/canvas/triggers/trigger-node";

export const nodeComponents = {
  INITIAL: InitialNode,
  MANUAL_TRIGGER: TriggerNode,
  CRON_TRIGGER: TriggerNode,
  WEBHOOK_TRIGGER: TriggerNode,
  FORM_SUBMITTED_TRIGGER: TriggerNode,
  SUBSCRIPTION_CONFIRMED_TRIGGER: TriggerNode,
  ORDER_COMPLETED_TRIGGER: TriggerNode,
  WAIT: ActionNode,
  HTTP_REQUEST: ActionNode,
  WEB_SEARCH: ActionNode,
  LLM: ActionNode,
  SEND_EMAIL: ActionNode,
  CREATE_CUSTOMER: ActionNode,
  CREATE_ORDER: ActionNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
