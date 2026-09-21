export interface RectLike {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
}

export interface TableMenuAnchor {
  cellPos: number;
  cell: RectLike;
  table: RectLike;
}

export type HoverSignal =
  | { type: "cell"; anchor: TableMenuAnchor }
  | { type: "interstitial" }
  | { type: "editorLeave"; towardMenu: boolean }
  | { type: "menuEnter" }
  | { type: "menuLeave" };

export interface HoverDecision {
  anchor: TableMenuAnchor | null;
  show: "arm" | "cancel" | "none";
  hide: "arm" | "cancel" | "none";
}

export const SHOW_DELAY_MS = 300;

export const HIDE_DELAY_MS = 200;

export const hoverReducer = (
  anchor: TableMenuAnchor | null,
  signal: HoverSignal,
): HoverDecision => {
  switch (signal.type) {
    case "cell": {
      const sameCell = anchor !== null && anchor.cellPos === signal.anchor.cellPos;
      return sameCell
        ? { anchor: signal.anchor, show: "cancel", hide: "cancel" }
        : { anchor, show: "arm", hide: "cancel" };
    }
    case "interstitial":
      return {
        anchor,
        show: "cancel",
        hide: anchor ? "arm" : "none",
      };
    case "editorLeave":
      return {
        anchor,
        show: "cancel",
        hide: signal.towardMenu ? "none" : anchor ? "arm" : "none",
      };
    case "menuEnter":
      return { anchor, show: "cancel", hide: "cancel" };
    case "menuLeave":
      return { anchor, show: "cancel", hide: anchor ? "arm" : "none" };
  }
};

export class DelayScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly onFire: () => void,
    private readonly delayMs: number,
  ) {}

  get pending(): boolean {
    return this.timer !== null;
  }

  arm(): void {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.onFire();
    }, this.delayMs);
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export class ShowScheduler extends DelayScheduler {
  constructor(onShow: () => void) {
    super(onShow, SHOW_DELAY_MS);
  }
}

export class HideScheduler extends DelayScheduler {
  constructor(onHide: () => void) {
    super(onHide, HIDE_DELAY_MS);
  }
}