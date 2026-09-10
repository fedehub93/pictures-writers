import { describe, expect, it } from "vitest";

import { countWordsFromText } from "./words-counter";

describe("countWordsFromText", () => {
  it("counts words separated by whitespace", () => {
    expect(countWordsFromText("One two three")).toBe(3);
  });

  it("treats empty or whitespace-only text as zero words", () => {
    expect(countWordsFromText("")).toBe(0);
    expect(countWordsFromText("   ")).toBe(0);
    expect(countWordsFromText("\n\t  ")).toBe(0);
  });

  it("normalises multiple whitespace characters before counting", () => {
    expect(countWordsFromText("One  two\nthree\tfour")).toBe(4);
  });
});
