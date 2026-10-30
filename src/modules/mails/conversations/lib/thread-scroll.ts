/**
 * Whether the thread is close enough to its newest message to keep following
 * it. Reading an older part of a conversation must never be interrupted by a
 * new message arriving, so the thread only re-pins when the reader is already
 * at the bottom.
 */

/** Distance in pixels from the end that still counts as "following". */
const THREAD_BOTTOM_THRESHOLD = 48;

export function isNearThreadBottom({
  scrollTop,
  clientHeight,
  scrollHeight,
  threshold = THREAD_BOTTOM_THRESHOLD,
}: {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  threshold?: number;
}): boolean {
  // Content shorter than the viewport cannot be scrolled away from the end.
  if (scrollHeight <= clientHeight) return true;

  return scrollHeight - scrollTop - clientHeight <= threshold;
}
