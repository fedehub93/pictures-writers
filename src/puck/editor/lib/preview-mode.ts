export type PuckPreviewMode = "edit" | "interactive";

export type PreviewToggleState = {
  /** Whether the canvas is currently in interactive preview. */
  active: boolean;
  /** Mode the control switches to on click. */
  nextMode: PuckPreviewMode;
  /** Visible label, describing the action and the current state. */
  label: string;
  /** Tooltip explaining what the action does. */
  title: string;
};

/**
 * Resolve the visible state of the Site region Preview control.
 *
 * Kept as a pure function so the next mode and the labels can be tested
 * without mounting Puck.
 */
export function getPreviewToggleState(
  mode: PuckPreviewMode,
): PreviewToggleState {
  const active = mode === "interactive";

  return active
    ? {
        active,
        nextMode: "edit",
        label: "Exit preview",
        title: "Return to editing the layout",
      }
    : {
        active,
        nextMode: "interactive",
        label: "Preview",
        title: "Open the layout in interactive preview",
      };
}
