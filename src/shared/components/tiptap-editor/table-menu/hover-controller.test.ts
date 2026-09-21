import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HIDE_DELAY_MS,
  HideScheduler,
  SHOW_DELAY_MS,
  ShowScheduler,
  hoverReducer,
  type HoverSignal,
  type TableMenuAnchor,
} from "./hover-controller";

const anchor: TableMenuAnchor = {
  cellPos: 42,
  cell: { top: 100, right: 220, bottom: 160, left: 80, width: 140 },
  table: { top: 40, right: 320, bottom: 220, left: 20, width: 300 },
};

const nextAnchor: TableMenuAnchor = { ...anchor, cellPos: 90 };

const createDwellHarness = (onShow: () => void) => {
  const scheduler = new ShowScheduler(onShow);
  let current: TableMenuAnchor | null = null;
  const signal = (signal: HoverSignal): void => {
    const decision = hoverReducer(current, signal);
    current = decision.anchor;
    if (decision.show === "arm") scheduler.arm();
    else if (decision.show === "cancel") scheduler.cancel();
  };
  return { signal };
};

describe("hoverReducer", () => {
  describe("cell signals", () => {
    it("arms a delayed show when nothing is visible yet", () => {
      const decision = hoverReducer(null, { type: "cell", anchor });
      expect(decision.anchor).toBeNull();
      expect(decision.show).toBe("arm");
      expect(decision.hide).toBe("cancel");
    });

    it("keeps the current anchor on transit to another cell and re-arms the show", () => {
      const decision = hoverReducer(anchor, {
        type: "cell",
        anchor: nextAnchor,
      });
      expect(decision.anchor).toBe(anchor);
      expect(decision.show).toBe("arm");
      expect(decision.hide).toBe("cancel");
    });

    it("adopts a same-cell signal immediately and cancels any pending show", () => {
      const refreshed = {
        ...anchor,
        cell: { ...anchor.cell, bottom: anchor.cell.bottom + 10 },
      };
      const decision = hoverReducer(anchor, { type: "cell", anchor: refreshed });
      expect(decision.anchor).toBe(refreshed);
      expect(decision.show).toBe("cancel");
      expect(decision.hide).toBe("cancel");
    });

    it("a later cell signal wins over a pending hide while keeping the old anchor", () => {
      let decision = hoverReducer(anchor, { type: "menuLeave" });
      decision = hoverReducer(decision.anchor, {
        type: "cell",
        anchor: nextAnchor,
      });
      expect(decision.anchor).toBe(anchor);
      expect(decision.show).toBe("arm");
      expect(decision.hide).toBe("cancel");
    });
  });

  describe("interstitial", () => {
    it("cancels a pending show when nothing is shown yet", () => {
      const decision = hoverReducer(null, { type: "interstitial" });
      expect(decision.anchor).toBeNull();
      expect(decision.show).toBe("cancel");
      expect(decision.hide).toBe("none");
    });

    it("cancels a pending show and arms a hide while the menu is visible", () => {
      const decision = hoverReducer(anchor, { type: "interstitial" });
      expect(decision.anchor).toBe(anchor);
      expect(decision.show).toBe("cancel");
      expect(decision.hide).toBe("arm");
    });
  });

  describe("editor leave and menu crossing", () => {
    it("leaving towards an overlay child (the + affinity) does not arm a hide", () => {
      const decision = hoverReducer(anchor, {
        type: "editorLeave",
        towardMenu: true,
      });
      expect(decision.anchor).toBe(anchor);
      expect(decision.show).toBe("cancel");
      expect(decision.hide).toBe("none");
    });

    it("leaving the editor towards nothing arms a delayed hide", () => {
      const decision = hoverReducer(anchor, {
        type: "editorLeave",
        towardMenu: false,
      });
      expect(decision.anchor).toBe(anchor);
      expect(decision.hide).toBe("arm");
    });

    it("entering the menu cancels both the pending show and any armed hide", () => {
      const decision = hoverReducer(anchor, { type: "menuEnter" });
      expect(decision.anchor).toBe(anchor);
      expect(decision.show).toBe("cancel");
      expect(decision.hide).toBe("cancel");
    });

    it("leaving the menu cancels the pending show and arms a delayed hide", () => {
      const decision = hoverReducer(anchor, { type: "menuLeave" });
      expect(decision.anchor).toBe(anchor);
      expect(decision.show).toBe("cancel");
      expect(decision.hide).toBe("arm");
    });
  });
});

describe("ShowScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows once after the dwell delay when armed", () => {
    const onShow = vi.fn();
    const scheduler = new ShowScheduler(onShow);

    scheduler.arm();
    vi.advanceTimersByTime(SHOW_DELAY_MS - 1);
    expect(onShow).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("re-arming on transit cancels the window so a quick pass never shows", () => {
    const onShow = vi.fn();
    const scheduler = new ShowScheduler(onShow);

    scheduler.arm();
    vi.advanceTimersByTime(SHOW_DELAY_MS - 1);
    scheduler.arm();
    vi.advanceTimersByTime(SHOW_DELAY_MS - 1);
    expect(onShow).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("cancel clears the pending show", () => {
    const onShow = vi.fn();
    const scheduler = new ShowScheduler(onShow);

    scheduler.arm();
    scheduler.cancel();
    vi.advanceTimersByTime(SHOW_DELAY_MS * 2);
    expect(onShow).not.toHaveBeenCalled();
  });

  it("reports whether a show is pending", () => {
    const scheduler = new ShowScheduler(() => undefined);
    expect(scheduler.pending).toBe(false);

    scheduler.arm();
    expect(scheduler.pending).toBe(true);

    scheduler.cancel();
    expect(scheduler.pending).toBe(false);
  });

  it("a stable dwell on one cell shows the menu after the delay", () => {
    const onShow = vi.fn();
    const harness = createDwellHarness(onShow);

    harness.signal({ type: "cell", anchor });
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("a quick pass across cells that leaves before the dwell never shows", () => {
    const onShow = vi.fn();
    const harness = createDwellHarness(onShow);

    harness.signal({ type: "cell", anchor });
    vi.advanceTimersByTime(SHOW_DELAY_MS - 50);
    harness.signal({ type: "cell", anchor: nextAnchor });
    vi.advanceTimersByTime(SHOW_DELAY_MS - 50);
    harness.signal({ type: "interstitial" });
    vi.advanceTimersByTime(SHOW_DELAY_MS * 2);
    expect(onShow).not.toHaveBeenCalled();
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