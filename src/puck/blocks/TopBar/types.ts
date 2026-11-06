import type { Slot, SlotComponent } from "@puckeditor/core";

import type { DecorationProps } from "@/puck/fields/decoration";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { Responsive } from "@/puck/utils/responsive";

export type TopBarSettings = {
  /** Show a close button that remembers the dismissal in localStorage. */
  dismissible?: boolean;
};

export type TopBarBlockProps = {
  /** Arbitrary blocks placed inside the strip. */
  content: Slot;
  settings?: TopBarSettings;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};

export type TopBarBlockUiProps = {
  /** Puck block id, used as the localStorage key for dismissal. */
  id?: string;
  Content: SlotComponent;
  dismissible?: boolean;
  /**
   * True inside the Puck canvas: the bar must stay visible so the user can
   * edit it even after dismissing it on the public site in the same browser.
   */
  editMode?: boolean;
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
};
