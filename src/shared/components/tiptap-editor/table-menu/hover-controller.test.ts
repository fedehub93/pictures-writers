import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HIDE_DELAY_MS,
  HideScheduler,
  hoverReducer,
  type TableMenuAnchor,
} from "./hover-controller";

const anchor: TableMenuAnchor = {
  cellPos: 42,
  cell: { top: 100, right: 220, bottom: 160, left: 80, width: 140 },
  table: { top: 40, right: 320, bottom: 220, left: 20, width: 300 },
};

describe("hoverReducer", () => {
  it("shows on a cell signal and cancels any pending hide", () => {
    const first = hoverReducer(null, { type: "interstitial" });
    const shown = hoverReducer(first.anchor, {
      type: "cell",
      anchor,
    });
    expect(shown.anchor).toBe(anchor);
    expect(shown.timer).toBe("cancel");
  });

  it("arms a delayed hide while the pointer is over non-cell editor content", () => {
    const decision = hoverReducer(anchor, { type: "interstitial" });
    expect(decision.anchor).toBe(anchor);
    expect(decision.timer).toBe("arm");
  });

  it("does not arm a hide when nothing is shown yet", () => {
    const decision = hoverReducer(null, { type: "interstitial" });
    expect(decision.anchor).toBeNull();
    expect(decision.timer).toBe("none");
  });

  it("entering the menu cancels the hide armed while crossing editor content", () => {
    const crossed = hoverReducer(anchor, { type: "interstitial" });
    const entered = hoverReducer(crossed.anchor, {
      type: "menuEnter",
    });
    expect(entered.anchor).toBe(anchor);
    expect(entered.timer).toBe("cancel");
  });

  it("leaving the editor towards an overlay child (the + affinity) does not arm a hide", () => {
    const decision = hoverReducer(anchor, {
      type: "editorLeave",
      towardMenu: true,
    });
    expect(decision.anchor).toBe(anchor);
    expect(decision.timer).toBe("none");
  });

  it("leaving the editor towards nothing arms a delayed hide", () => {
    const decision = hoverReducer(anchor, {
      type: "editorLeave",
      towardMenu: false,
    });
    expect(decision.anchor).toBe(anchor);
    expect(decision.timer).toBe("arm");
  });

  it("leaving the menu arms a delayed hide", () => {
    const decision = hoverReducer(anchor, { type: "menuLeave" });
    expect(decision.anchor).toBe(anchor);
    expect(decision.timer).toBe("arm");
  });

  it("a later cell signal wins over a pending hide", () => {
    let decision = hoverReducer(anchor, { type: "menuLeave" });
    const next = { ...anchor, cellPos: 90 };
    decision = hoverReducer(decision.anchor, {
      type: "cell",
      anchor: next,
    });
    expect(decision.anchor).toBe(next);
    expect(decision.timer).toBe("cancel");
  });
});

describe("HideScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides once after the delay when armed", () => {
    const onHide = vi.fn();
    const scheduler = new HideScheduler(onHide);

    scheduler.arm();
    vi.advanceTimersByTime(HIDE_DELAY_MS - 1);
    expect(onHide).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("re-arming resets the single slot so only the latest hide runs", () => {
    const onHide = vi.fn();
    const scheduler = new HideScheduler(onHide);

    scheduler.arm();
    vi.advanceTimersByTime(50);
    scheduler.arm();
    vi.advanceTimersByTime(50);
    expect(onHide).not.toHaveBeenCalled();

    vi.advanceTimersByTime(HIDE_DELAY_MS);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("cancel clears the pending hide", () => {
    const onHide = vi.fn();
    const scheduler = new HideScheduler(onHide);

    scheduler.arm();
    scheduler.cancel();
    vi.advanceTimersByTime(HIDE_DELAY_MS * 2);
    expect(onHide).not.toHaveBeenCalled();
  });

  it("reports whether a hide is pending", () => {
    const scheduler = new HideScheduler(() => undefined);
    expect(scheduler.pending).toBe(false);

    scheduler.arm();
    expect(scheduler.pending).toBe(true);

    scheduler.cancel();
    expect(scheduler.pending).toBe(false);
  });
});