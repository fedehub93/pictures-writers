"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
import { useAtom, useSetAtom } from "jotai";

import "@xyflow/react/dist/style.css";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

import { nodeComponents } from "../../config/node-components";
import { findCatalogEntry } from "../../config/node-catalog";
import {
  getNodeConfigPanel,
  NodeConfigPanelHost,
} from "../../config/node-config-panels";
import { useSuspenseAutomation } from "../../../hooks/use-automations";
import { TRIGGER_NODE_TYPES } from "@/modules/automations/constants";

import { editorAtom, selectedNodeIdAtom } from "../../store/atoms";
import { AddNodeButton } from "../components/canvas/add-node-button";
import { ExecuteAutomationButton } from "../components/canvas/execute-automation-button";

export const EditorView = ({ automationId }: { automationId: string }) => {
  const { data: automation } = useSuspenseAutomation(automationId);

  const setEditor = useSetAtom(editorAtom);
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);

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

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const hasConfigPanel = Boolean(getNodeConfigPanel(selectedNode?.type));
  const selectedLabel =
    findCatalogEntry(selectedNode?.type)?.label ?? selectedNode?.type ?? "";

  // A deleted node must not keep the configuration panel open.
  useEffect(() => {
    if (selectedNodeId && !selectedNode) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, selectedNode, setSelectedNodeId]);

  const handleConfigChange = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedNodeId) {
        return;
      }
      setNodes((nodesSnapshot) =>
        nodesSnapshot.map((node) =>
          node.id === selectedNodeId
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      );
    },
    [selectedNodeId],
  );

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
        onPaneClick={() => setSelectedNodeId(null)}
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

      <Sheet
        open={Boolean(selectedNode && hasConfigPanel)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNodeId(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selectedLabel}</SheetTitle>
            <SheetDescription>
              Configure this step. Fields support {"{{ ... }}"} template
              expressions from the run payload and previous steps.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {selectedNode ? (
              <NodeConfigPanelHost
                type={selectedNode.type}
                data={(selectedNode.data ?? {}) as Record<string, unknown>}
                onChange={handleConfigChange}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
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
