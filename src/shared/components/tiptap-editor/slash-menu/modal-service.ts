import type { SlashCommandModalService } from "./types";

/**
 * No-op modal service used when an editor surface does not provide a picker.
 *
 * Commands that rely on a modal will still delete the slash query so the
 * typing flow is not disrupted, but they will not insert any content.
 */
export const noOpSlashCommandModalService: SlashCommandModalService = {
  openImagePicker: () => {},
  openVideoUrlPicker: () => {},
  openProductPicker: () => {},
};
