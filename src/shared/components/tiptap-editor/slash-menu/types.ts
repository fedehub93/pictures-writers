import type { Editor, Range } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";

export type SlashCommandGroup = "text" | "media" | "content";

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
