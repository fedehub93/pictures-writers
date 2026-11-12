import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

import type { BlockDragRef } from "@/puck/types";
import { getInertAnchorProps } from "@/puck/utils/inert-anchor";

import {
  getLinkHref,
  getLinkOpenInNewTab,
  type LegacyLinkProps,
  type LinkProps,
} from "../types";

/**
 * Renders a single resolved link inline (no wrapper element).
 *
 * Broken or unresolved entity links render as plain text, matching the Link
 * block, so a footer column never shows a dead anchor. When `children` is
 * provided it replaces the link label, letting blocks that render their own
 * copy reuse the anchor/plain-text behaviour.
 *
 * `dragRef` is the editor's block-root ref: a block that renders this component
 * *is* the anchor (or the plain-text span), so the ref has to reach whichever
 * element is rendered rather than landing on a wrapper around it.
 *
 * `editing` is Puck's `isEditing`: in the canvas the anchor keeps its markup
 * and its `target`/`rel`, but the click no longer navigates, so the click
 * selects the block instead of leaving the document. The published page and
 * the interactive preview pass `false` and keep every default action.
 */
export const InlineSmartLink = ({
  link,
  className,
  style,
  children,
  onClick,
  editing = false,
  dragRef,
}: {
  link?: LinkProps | LegacyLinkProps;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Navigation feedback for the consumer; the canvas does not run it. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Editor-only: cancel the navigation and keep the click for the canvas. */
  editing?: boolean;
  /** Editor-only: Puck's selection ref, attached to the rendered element. */
  dragRef?: BlockDragRef;
}) => {
  if (!link) return null;

  const href = getLinkHref(link);
  const content = children ?? link.label ?? href;

  if (!content) return null;
  if (!href) {
    return (
      <span
        className={className}
        style={style}
        onClick={editing ? undefined : onClick}
        ref={dragRef}
      >
        {content}
      </span>
    );
  }

  const openInNewTab = getLinkOpenInNewTab(link);

  /**
   * The canvas cancels the default action in the capture phase instead of
   * swapping the element: see `getInertAnchorProps` for why capture is not
   * an implementation detail.
   *
   * `onClick` is the consumer's navigation feedback (the mobile sheet closes
   * itself through it), so the canvas does not run it either: the editor owns
   * the click, and closing the menu would hide what is being edited.
   */
  const inertAnchorHandlers = getInertAnchorProps(editing);

  return (
    <Link
      href={href as Route}
      className={className}
      style={style}
      onClick={editing ? undefined : onClick}
      {...inertAnchorHandlers}
      prefetch={false}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer" : undefined}
      ref={dragRef}
    >
      {content}
    </Link>
  );
};
