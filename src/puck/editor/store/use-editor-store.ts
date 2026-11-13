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
  /**
   * The text block whose editor is armed, if any. A locked text block behaves
   * like every other block (select and drag, no caret); arming it is the one
   * deliberate gesture that opens the inline editor.
   *
   * Session state, not document state: it is never persisted, never written to
   * the Puck data, and it names at most one block, so opening a second text
   * block closes the first. `null` means every text block is locked.
   */
  editingTextBlockId: string | null;
  setScale: (scale: number) => void;
  setIsAutoZoom: (status: boolean) => void;
  setShowSiteLayout: (show: boolean) => void;
  /** Arm one text block; arming a second one closes the first. */
  enterTextEditMode: (blockId: string) => void;
  /** Leave text editing mode, if any block is armed. */
  exitTextEditMode: () => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  scale: 1,
  isAutoZoom: true,
  showSiteLayout: true,
  editingTextBlockId: null,
  setScale: (scale) => set({ scale }),
  setIsAutoZoom: (status) => set({ isAutoZoom: status }),
  setShowSiteLayout: (showSiteLayout) => set({ showSiteLayout }),
  enterTextEditMode: (editingTextBlockId) => set({ editingTextBlockId }),
  exitTextEditMode: () => set({ editingTextBlockId: null }),
}));
