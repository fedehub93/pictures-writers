import { describe, expect, it } from "vitest";

import {
  estimateReadingTime,
  WORDS_PER_MINUTE,
} from "./writing-metrics";

describe("writing metrics", () => {
  describe("estimateReadingTime", () => {
    it("returns 0 for empty content", () => {
      expect(estimateReadingTime(0)).toBe(0);
    });

    it("rounds up to 1 minute for any non-empty content", () => {
      expect(estimateReadingTime(1)).toBe(1);
      expect(estimateReadingTime(WORDS_PER_MINUTE - 1)).toBe(1);
    });

    it("rounds up to the next minute when the word count exceeds a full minute", () => {
      expect(estimateReadingTime(WORDS_PER_MINUTE)).toBe(1);
      expect(estimateReadingTime(WORDS_PER_MINUTE + 1)).toBe(2);
      expect(estimateReadingTime(WORDS_PER_MINUTE * 3)).toBe(3);
    });
  });
});
