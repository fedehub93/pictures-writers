import { describe, expect, it } from "vitest";

import {
  getHeaderClassName,
  HEADER_STICKY_CLASS_NAME,
  isHeaderSticky,
} from "../header-sticky";

describe("isHeaderSticky", () => {
  it("reads the switch from the region root props", () => {
    expect(isHeaderSticky({ root: { props: { sticky: true } } })).toBe(true);
  });

  it("treats an absent switch as normal flow", () => {
    expect(isHeaderSticky({ root: {} })).toBe(false);
    expect(isHeaderSticky({ root: { props: {} } })).toBe(false);
    expect(isHeaderSticky({ root: { props: { sticky: false } } })).toBe(false);
  });

  it("treats non-boolean values as normal flow", () => {
    for (const sticky of ["true", 1, 0, null, {}, []]) {
      expect(isHeaderSticky({ root: { props: { sticky } } })).toBe(false);
    }
  });

  it("never throws on an empty, legacy or missing document", () => {
    expect(isHeaderSticky(null)).toBe(false);
    expect(isHeaderSticky(undefined)).toBe(false);
    expect(isHeaderSticky({})).toBe(false);
    expect(isHeaderSticky({ root: null })).toBe(false);
    expect(isHeaderSticky({ root: { props: null } })).toBe(false);
    expect(isHeaderSticky({ root: "legacy" })).toBe(false);
  });
});

describe("getHeaderClassName", () => {
  it("adds the sticky positioning classes when the header is sticky", () => {
    expect(getHeaderClassName({ root: { props: { sticky: true } } })).toBe(
      HEADER_STICKY_CLASS_NAME,
    );
  });

  it("returns no class at all when the header is not sticky", () => {
    expect(getHeaderClassName({ root: {} })).toBeUndefined();
    expect(getHeaderClassName(null)).toBeUndefined();
  });
});
