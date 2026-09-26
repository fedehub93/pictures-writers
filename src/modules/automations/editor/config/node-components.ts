import { NodeTypes } from "@xyflow/react";

import { ActionNode } from "../ui/components/canvas/action-node";
import { InitialNode } from "../ui/components/canvas/initial-node";

export const nodeComponents = {
  INITIAL: InitialNode,
  SEND_EMAIL: ActionNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
