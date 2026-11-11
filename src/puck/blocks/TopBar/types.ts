import type { ReactNode } from "react";
import type { Slot } from "@puckeditor/core";

import type { DecorationProps } from "@/puck/fields/decoration";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { LayoutProps } from "@/puck/fields/layout";
import type { Responsive } from "@/puck/utils/responsive";

export type TopBarSettings = {
  /** Show a close button that remembers the dismissal in localStorage. */
  dismissible?: boolean;
};

export type TopBarBlockProps = {
  /** Arbitrary blocks placed inside the strip. */
  content: Slot;
  settings?: TopBarSettings;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};

export type TopBarBlockUiProps = {
  /** Puck block id, used as the localStorage key for dismissal. */
  id?: string;
  /**
   * Slot content, rendered by the block render before crossing the client
   * boundary. A Slot is a function, and React refuses to pass functions from
   * server components to client components.
   */
  children: ReactNode;
  dismissible?: boolean;
  /**
   * True inside the Puck canvas: the bar must stay visible so the user can
   * edit it even after dismissing it on the public site in the same browser.
   */
  editMode?: boolean;
  /**
   * Root-level responsive style variables: display, `align-self`, dimension and
   * decoration. The container layout variables live on the slot wrapper.
   */
  styleVars?: Record<string, string>;
  /** Authored display classes and editor visibility markers for the root. */
  layoutClassName?: string;
};
