import type { DndConfig } from "@puckeditor/core";

/**
 * The editor's drag configuration, and why it is not Puck's default.
 *
 * A text block in text editing mode has a live caret, and dnd-kit refuses a
 * press whose target is inside `[contenteditable]`. Without the action bar's
 * handle there would be no way to move the block before leaving the mode.
 * Puck keeps the block body as an activator as well and gives the handle
 * `Distance(5)` with no delay, so the locked block still drags from its text
 * (ADR-0042 measures both gestures).
 */
export const editorDndConfig: DndConfig = { enableDragHandle: true };
