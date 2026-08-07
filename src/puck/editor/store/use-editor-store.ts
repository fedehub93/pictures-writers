import { create } from "zustand";

interface EditorState {
  scale: number;
  isAutoZoom: boolean;
  setScale: (scale: number) => void;
  setIsAutoZoom: (status: boolean) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  scale: 1,
  isAutoZoom: true,
  setScale: (scale) => set({ scale }),
  setIsAutoZoom: (status) => set({ isAutoZoom: status }),
}));
