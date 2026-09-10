import type { Editor, Range } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";

export type SlashCommandGroup = "text" | "media" | "content";

export interface SelectedImage {
  src: string;
  alt: string;
}

export interface SelectedVideo {
  src: string;
}

export interface SelectedProduct {
  productRootId: string;
}

/**
 * Contract used by slash commands that need to open a modal picker.
 *
 * Production callers (e.g. the blog admin) inject an implementation that
 * wires the existing modals; tests inject a fake and verify the resulting
 * document JSON without touching UI or endpoints.
 */
export interface SlashCommandModalService {
  openImagePicker: (onSelect: (image: SelectedImage) => void) => void;
  openVideoUrlPicker: (onSelect: (video: SelectedVideo) => void) => void;
  openProductPicker: (onSelect: (product: SelectedProduct) => void) => void;
}

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  group: SlashCommandGroup;
  icon: LucideIcon;
  /**
   * Executes the command after the slash query range has been removed.
   * Returns whether the command succeeded.
   */
  execute: (editor: Editor, range: Range) => boolean;
}
