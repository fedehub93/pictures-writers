import { describe, expect, it } from "vitest";

import { isNearThreadBottom } from "../thread-scroll";

describe("isNearThreadBottom", () => {
  it("treats content shorter than the viewport as being at the bottom", () => {
    expect(
      isNearThreadBottom({
        scrollTop: 0,
        clientHeight: 600,
        scrollHeight: 400,
      }),
    ).toBe(true);
  });

  it("accepts a reader at the very end", () => {
    expect(
      isNearThreadBottom({
        scrollTop: 1200,
        clientHeight: 600,
        scrollHeight: 1800,
      }),
    ).toBe(true);
  });

  it("accepts a reader inside the threshold", () => {
    expect(
      isNearThreadBottom({
        scrollTop: 1152,
        clientHeight: 600,
        scrollHeight: 1800,
      }),
    ).toBe(true);
  });

  it("refuses a reader who scrolled up to an earlier message", () => {
    expect(
      isNearThreadBottom({
        scrollTop: 400,
        clientHeight: 600,
        scrollHeight: 1800,
      }),
    ).toBe(false);
  });

  it("honours a custom threshold", () => {
    expect(
      isNearThreadBottom({
        scrollTop: 1152,
        clientHeight: 600,
        scrollHeight: 1800,
        threshold: 10,
      }),
    ).toBe(false);
  });
});
