"use client";

import { FormNodeInstance } from "../types";

import { create } from "zustand";
import { GROUP_ELEMENT, GROUP_LAYOUT } from "../constants";

interface DesignerStore {
  // --- STATE ---
  nodes: FormNodeInstance[];
  activeNodeId: string | null;

  // --- ACTIONS ---
  setActiveNodeId: (id: string | null) => void;

  // --- NODE MUTATIONS ---
  addNode: (
    node: FormNodeInstance,
    index?: number,
    parentId?: string | null,
  ) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, properties: any) => void;

  setNodes: (nodes: FormNodeInstance[]) => void;
}

export const useDesigner = create<DesignerStore>((set) => ({
  nodes: [],
  activeNodeId: null,

  setActiveNodeId: (id) => set({ activeNodeId: id }),

  setNodes: (nodes) => set({ nodes }),

  addNode: (node, index, parentId) =>
    set((state) => {
      const newNodes = [...state.nodes];

      const isAddToLayout = parentId && node.group === GROUP_ELEMENT;

      // Add to layout
      if (isAddToLayout) {
        const parentIndex = newNodes.findIndex((n) => n.id === parentId);

        if (parentIndex > -1 && newNodes[parentIndex].group === GROUP_LAYOUT) {
          const parent = newNodes[parentIndex];

          const newChildren = [...parent.children];
          if (index !== undefined) {
            newChildren.splice(index, 0, node);
          } else {
            newChildren.push(node);
          }

          newNodes[parentIndex] = {
            ...parent,
            children: newChildren,
          };
        }
        return { nodes: newNodes };
      }

      //  Add to root
      if (index != undefined) {
        newNodes.splice(index, 0, node);
      } else {
        newNodes.push(node);
      }

      return { nodes: newNodes };
    }),
  removeNode: (id) =>
    set((state) => {
      // Get all other nodes
      console.log(id);
      const filteredRoot = state.nodes.filter((node) => node.id !== id);

      // 1. If length is difference we have removed the node
      if (filteredRoot.length !== state.nodes.length) {
        const newActiveNodeId =
          state.activeNodeId === id ? null : state.activeNodeId;
        return { nodes: filteredRoot, activeNodeId: newActiveNodeId };
      }

      // 2. If node not found I will search inside the layout nodes
      const newNodes = state.nodes.map((node) => {
        if (node.group === GROUP_LAYOUT) {
          const filteredChildren = node.children.filter(
            (child) => child.id !== id,
          );

          // If length is difference we have removed the node
          if (filteredChildren.length !== node.children.length) {
            return { ...node, children: filteredChildren };
          }
        }
        return node;
      });

      const newActiveNodeId =
        state.activeNodeId === id ? null : state.activeNodeId;
      return { nodes: newNodes, activeNodeId: newActiveNodeId };
    }),
  updateNode: (id, properties) =>
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        // Root update
        if (node.id === id) {
          return { ...node, properties: { ...node.properties, ...properties } };
        }

        // Within layout update
        if (node.group === GROUP_LAYOUT) {
          const childIndex = node.children.findIndex((node) => node.id === id);
          if (childIndex > -1) {
            const newChildren = [...node.children];
            newChildren[childIndex] = {
              ...newChildren[childIndex].properties,
              ...properties,
            };
            return { ...node, children: newChildren };
          }
        }

        return node;
      });

      return { nodes: newNodes };
    }),
}));
