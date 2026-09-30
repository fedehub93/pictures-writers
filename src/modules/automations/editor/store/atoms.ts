import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";

export const editorAtom = atom<ReactFlowInstance | null>(null);

/// Id of the node whose configuration panel is currently open, if any.
export const selectedNodeIdAtom = atom<string | null>(null);
