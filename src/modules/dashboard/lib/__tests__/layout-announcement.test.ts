import { describe, expect, it } from "vitest";

import type { WidgetGridPlacement } from "@/shared/dashboard/types";

import {
  describePlacement,
  layoutChangeAnnouncement,
} from "../layout-announcement";

const placement = (
  x: number,
  y: number,
  w: number,
  h: number,
): WidgetGridPlacement => ({ x, y, w, h });

describe("describePlacement", () => {
  it("names the size and the one-based position", () => {
    expect(describePlacement(placement(0, 0, 6, 4))).toBe(
      "6 columns by 4 rows at column 1, row 1",
    );
  });

  it("offsets the column and row into one-based coordinates", () => {
    expect(describePlacement(placement(3, 2, 3, 5))).toBe(
      "3 columns by 5 rows at column 4, row 3",
    );
  });
});

describe("layoutChangeAnnouncement", () => {
  it("prefixes the description with the widget's effective title", () => {
    expect(layoutChangeAnnouncement("Contacts", placement(0, 0, 6, 4))).toBe(
      "Contacts: 6 columns by 4 rows at column 1, row 1.",
    );
  });
});
