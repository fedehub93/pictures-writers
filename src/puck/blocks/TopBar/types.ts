import type { ReactNode } from "react";
import type { Slot } from "@puckeditor/core";

import type { DecorationProps } from "@/puck/fields/decoration";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { LayoutProps } from "@/puck/fields/layout";
import type { BlockDragRef } from "@/puck/types";
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
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
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
   * Root-level responsive style variables: display, `align-self`, size,
   * spacing and decoration. The container layout variables live on the slot
   * wrapper.
   */
  styleVars?: Record<string, string>;
  /** Authored display classes and editor visibility markers for the root. */
  layoutClassName?: string;
  /**
   * The strip root is the block root: it is what Puck selects and outlines, and
   * what the parent lays out. The slot inside it only arranges the content, so
   * the ref must not go there.
   *
   * `inline` is Puck's only supported way to skip its per-block wrapper `div`.
   * See {@link BlockDragRef} for the behaviour an upgrade has to preserve.
   */
  dragRef?: BlockDragRef;
};
