import type { MouseEvent } from "react";

/**
 * Props that keep a block whose root is an anchor inert while the canvas is
 * open.
 *
 * The block root is the element Puck owns: it attaches a native `click`
 * listener to it and calls `stopPropagation()` there (`DraggableComponent` in
 * `@puckeditor/core`). React delegates its handlers to the container the canvas
 * portal renders into, so a bubble handler on the anchor never runs for a block
 * whose root *is* the anchor; capture runs on the way down, before that
 * listener, so `preventDefault` still reaches the browser. A router-aware
 * renderer that respects `defaultPrevented` (`next/link`) also bails instead of
 * pushing a route.
 *
 * The auxiliary click is separate because a middle click activates a link
 * through `auxclick`, not `click`. React's synthetic click also covers Enter on
 * a focused anchor.
 *
 * The handlers exist only while editing, so the published render receives none
 * of them and the markup stays unchanged.
 */
export function getInertAnchorProps(editing?: boolean) {
  if (!editing) return {};

  return {
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
    },
    onAuxClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (event.button === 1) event.preventDefault();
    },
  };
}
