import { describe, expect, it } from "vitest";

import { resolveRowSpans } from "../widget-rows";

describe("resolveRowSpans", () => {
  it("leaves a row that already fills the grid untouched", () => {
    expect(resolveRowSpans([3, 3])).toEqual([3, 3]);
    expect(resolveRowSpans([2, 2, 2])).toEqual([2, 2, 2]);
    expect(resolveRowSpans([6, 6])).toEqual([6, 6]);
  });

  it("stretches the last item of a partial row to close it", () => {
    expect(resolveRowSpans([2, 3])).toEqual([2, 4]);
    expect(resolveRowSpans([3, 2])).toEqual([3, 3]);
    expect(resolveRowSpans([6, 2])).toEqual([6, 6]);
  });

  it("closes an earlier row a later item could not join", () => {
    expect(resolveRowSpans([2, 3, 2])).toEqual([2, 4, 6]);
    expect(resolveRowSpans([3, 2, 2])).toEqual([3, 3, 6]);
  });

  it("stretches a lone trailing item to the full grid", () => {
    expect(resolveRowSpans([3])).toEqual([6]);
    expect(resolveRowSpans([2, 2, 2, 2])).toEqual([2, 2, 2, 6]);
  });

  it("returns an empty list unchanged", () => {
    expect(resolveRowSpans([])).toEqual([]);
  });

  it("preserves the input length and order", () => {
    const input = [2, 3, 2, 6, 3, 2];
    const output = resolveRowSpans(input);
    expect(output).toHaveLength(input.length);
  });
});
