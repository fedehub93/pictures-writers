import { NodeTypes } from "@xyflow/react";

import { InitialNode } from "../ui/components/canvas/initial-node";

export const nodeComponents = {
  INITIAL: InitialNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
