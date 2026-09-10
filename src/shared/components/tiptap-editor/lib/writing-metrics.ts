/**
 * Editorial reading-speed assumption: the average reader is assumed to read
 * approximately this many words per minute. This is a deterministic, fixed
 * value used for the reading-time estimate shown below the editor.
 */
export const WORDS_PER_MINUTE = 200;

/**
 * Estimates reading time from a word count.
 *
 * - Empty content returns 0.
 * - Any non-empty content rounds up to the nearest minute so that a short
 *   paragraph is shown as at least 1 minute of reading time.
 */
export function estimateReadingTime(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}
