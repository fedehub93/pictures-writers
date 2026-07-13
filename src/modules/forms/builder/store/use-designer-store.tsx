"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { type FormNodeDynamicInstance, type FormRootInstance } from "../types";

import {
  addNodeToChildren,
  extractNodeById,
  extractNodeFromParent,
  findNodeRecursively,
  removeNodeFromChildren,
} from "../helpers";

interface DesignerStore {
  // --- STATE ---
  root: FormRootInstance;
  activeNodeId: string | null;

  // --- ACTIONS ---
  setActiveNodeId: (id: string | null) => void;

  // --- NODE MUTATIONS ---
  addNode: (
    node: FormNodeDynamicInstance,
    index?: number,
    parentId?: string | "root",
  ) => void;
  updateNodeProperties: (id: string, properties: Record<string, any>) => void;

  removeNodeById: (id: string) => void;

  moveNodeToContainer: (sourceId: string, targetContainerId: string) => void;
  moveNodeInTree: (
    initialIndex: number,
    index: number,
    initialParentId?: string,
    targetParentId?: string,
  ) => void;

  setRoot: (root: FormRootInstance) => void;
}

const initialRoot: FormRootInstance = {
  id: "root",
  // group: "layout",
  isContainer: true,
  type: "Root",
  properties: {}, // Aggiungi qui eventuali proprietà globali del form
  children: [
    {
      id: "A",
      // group: "element",
      isContainer: false,
      type: "TextField",
      properties: {
        label: "Label",
        helperText: "Helper",
        placeholder: "Placeholder",
      },
    },
    {
      id: "pippo",
      isContainer: true,
      type: "Grid",
      children: [],
      properties: {
        label: "Label",
        column: 2,
        gap: "2px",
      },
    },
    {
      id: "B",
      // group: "element",
      isContainer: false,
      type: "TextField",
      properties: {
        label: "Label",
        helperText: "Helper",
        placeholder: "Placeholder",
      },
    },
  ],
};

// Wrap the creator function with immer()
export const useDesigner = create<DesignerStore>()(
  immer((set, get) => ({
    root: initialRoot,
    activeNodeId: null,

    // Basic state updates with Immer
    setActiveNodeId: (id) =>
      set((draft) => {
        draft.activeNodeId = id;
      }),

    setRoot: (root) =>
      set((draft) => {
        draft.root = root;
      }),

    // Complex mutations powered by Immer
    addNode: (node, index, parentId = "root") =>
      set((draft) => {
        if (parentId === "root") {
          if (index !== undefined) {
            draft.root.children.splice(index, 0, node);
          } else {
            draft.root.children.push(node);
          }
          return; // Early return to avoid further processing
        }

        // Delegate nested logic to the helper, passing the draft children array
        addNodeToChildren(draft.root.children, parentId, node, index);
      }),
    updateNodeProperties: (id, properties) =>
      set((draft) => {
        if (id === "root") {
          Object.assign(draft.root.properties, properties);
          return;
        }

        const node = findNodeRecursively(draft.root, id);

        if (node) {
          Object.assign(node.properties, properties);
        }
      }),
    removeNodeById: (id) =>
      set((draft) => {
        removeNodeFromChildren(draft.root.children, id);

        // Optional: If the deleted node was active, reset activeNodeId
        if (draft.activeNodeId === id) {
          draft.activeNodeId = null;
        }
      }),
    moveNodeToContainer: (sourceId, targetContainerId) =>
      set((draft) => {
        // 1. Identify and extract the node from the tree
        const nodeToMove = extractNodeById(draft.root.children, sourceId);

        if (!nodeToMove) {
          return; // Node not found, abort mutation
        }

        // 2. Insert the extracted node into the new destination
        if (targetContainerId === "root") {
          draft.root.children.push(nodeToMove);
        } else {
          // addNodeToChildren handles recursive searching for the target container
          // and pushes the node into its children array.
          addNodeToChildren(draft.root.children, targetContainerId, nodeToMove);
        }
      }),
    moveNodeInTree: (
      initialIndex,
      index,
      initialParentId = "root",
      targetParentId = "root",
    ) =>
      set((draft) => {
        let nodeToMove: FormNodeDynamicInstance | undefined;

        // 1. EXTRACT
        if (initialParentId === "root") {
          nodeToMove = draft.root.children.splice(initialIndex, 1)[0];
        } else {
          nodeToMove = extractNodeFromParent(
            draft.root.children,
            initialParentId,
            initialIndex,
          );
        }

        if (!nodeToMove) return;

        // 2. INSERT
        if (targetParentId === "root") {
          draft.root.children.splice(index, 0, nodeToMove);
        } else {
          addNodeToChildren(
            draft.root.children,
            targetParentId,
            nodeToMove,
            index,
          );
        }
      }),
  })),
);
