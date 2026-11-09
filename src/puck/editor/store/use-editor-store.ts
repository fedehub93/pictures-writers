import { create } from "zustand";

interface EditorState {
  scale: number;
  isAutoZoom: boolean;
  /**
   * Draw the Site layout preview (Header and Footer regions) around the Page
   * in the page editor canvas. Defaults to on and is intentionally not
   * persisted: it belongs to the current editing session only.
   */
  showSiteLayout: boolean;
  setScale: (scale: number) => void;
  setIsAutoZoom: (status: boolean) => void;
  setShowSiteLayout: (show: boolean) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  scale: 1,
  isAutoZoom: true,
  showSiteLayout: true,
  setScale: (scale) => set({ scale }),
  setIsAutoZoom: (status) => set({ isAutoZoom: status }),
  setShowSiteLayout: (showSiteLayout) => set({ showSiteLayout }),
}));
