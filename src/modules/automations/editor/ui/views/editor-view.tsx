"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from "@xyflow/react";
import { useSetAtom } from "jotai";

import "@xyflow/react/dist/style.css";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { nodeComponents } from "../../config/node-components";
import { useSuspenseAutomation } from "../../../hooks/use-automations";
import { TRIGGER_NODE_TYPES } from "@/modules/automations/constants";

import { editorAtom } from "../../store/atoms";
import { AddNodeButton } from "../components/canvas/add-node-button";
import { ExecuteAutomationButton } from "../components/canvas/execute-automation-button";

export const EditorView = ({ automationId }: { automationId: string }) => {
  const { data: automation } = useSuspenseAutomation(automationId);

  const setEditor = useSetAtom(editorAtom);

  const [nodes, setNodes] = useState<Node[]>(automation.nodes);
  const [edges, setEdges] = useState<Edge[]>(automation.connections);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const hasManualTrigger = useMemo(() => {
    return nodes.some(
      (node) =>
        node.type != null &&
        (TRIGGER_NODE_TYPES as readonly string[]).includes(node.type),
    );
  }, [nodes]);

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        snapGrid={[10, 10]}
        snapToGrid
        panOnScroll
        panOnDrag={false}
        selectionOnDrag
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <AddNodeButton />
        </Panel>
        {hasManualTrigger && (
          <Panel position="bottom-center">
            <ExecuteAutomationButton automationId={automationId} />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export const EditorViewLoading = () => {
  return (
    <LoadingState
      title="Loading Editor"
      description="This may take a few seconds"
    />
  );
};

export const EditorViewError = () => {
  return <ErrorState title="Error Editor" description="Something went wrong" />;
};
