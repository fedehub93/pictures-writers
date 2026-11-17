import { SquareIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  ELEMENT_ICONS,
  ELEMENT_LABELS,
} from "../editor/ui/view/element-meta";

describe("editor element metadata", () => {
  it("gives the header-only blocks dedicated icons", () => {
    for (const name of ["TopBar", "SearchBar", "NavbarBlock"]) {
      expect(ELEMENT_ICONS[name], `${name} icon`).toBeDefined();
      expect(ELEMENT_ICONS[name], `${name} icon`).not.toBe(SquareIcon);
    }
  });

  it("gives the header-only blocks human labels", () => {
    expect(ELEMENT_LABELS.TopBar).toBe("Top bar");
    expect(ELEMENT_LABELS.SearchBar).toBe("Search bar");
    expect(ELEMENT_LABELS.NavbarBlock).toBe("Navbar");
  });
});
