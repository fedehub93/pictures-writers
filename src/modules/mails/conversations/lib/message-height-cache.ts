import "client-only";

/**
 * Heights measured by the message frames. Reusing the last measurement lets a
 * re-expanded or re-rendered message paint at its real size instead of
 * collapsing to zero, which is what made the thread jump while scrolling.
 *
 * The cache is deliberately tiny and self-correcting: a cached height is only a
 * first-paint estimate. The frame re-measures on load or after a width change
 * and overwrites the entry, so a stale value never sticks.
 */

const MAX_ENTRIES = 200;

const heights = new Map<string, number>();

/**
 * A message has two legitimate heights: with remote images blocked and with
 * them revealed. Keying by both keeps the estimate right after a toggle.
 */
export function messageHeightKey(
  messageId: string,
  imagesRevealed: boolean,
): string {
  return `${messageId}:${imagesRevealed ? "images" : "blocked"}`;
}

export function getCachedMessageHeight(key: string): number | null {
  return heights.get(key) ?? null;
}

export function cacheMessageHeight(key: string, height: number): void {
  if (!Number.isFinite(height) || height <= 0) return;

  // Re-insert so the most recently measured entries are the last to be evicted.
  heights.delete(key);
  heights.set(key, Math.ceil(height));

  if (heights.size > MAX_ENTRIES) {
    const oldest = heights.keys().next();

    if (!oldest.done) heights.delete(oldest.value);
  }
}

export function clearMessageHeightCache(): void {
  heights.clear();
}
