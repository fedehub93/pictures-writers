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
  timer: "arm" | "cancel" | "none";
}

export const HIDE_DELAY_MS = 200;

export const hoverReducer = (
  anchor: TableMenuAnchor | null,
  signal: HoverSignal,
): HoverDecision => {
  switch (signal.type) {
    case "cell":
      return { anchor: signal.anchor, timer: "cancel" };
    case "interstitial":
      return { anchor, timer: anchor ? "arm" : "none" };
    case "editorLeave":
      return {
        anchor,
        timer: signal.towardMenu ? "none" : anchor ? "arm" : "none",
      };
    case "menuEnter":
      return { anchor, timer: "cancel" };
    case "menuLeave":
      return { anchor, timer: anchor ? "arm" : "none" };
  }
};

export class HideScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly onHide: () => void,
    private readonly delayMs = HIDE_DELAY_MS,
  ) {}

  get pending(): boolean {
    return this.timer !== null;
  }

  arm(): void {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.onHide();
    }, this.delayMs);
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}