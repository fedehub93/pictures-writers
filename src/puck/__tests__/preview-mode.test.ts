import { describe, expect, it } from "vitest";

import { getPreviewToggleState } from "../editor/lib/preview-mode";

describe("Site region preview toggle", () => {
  it("offers interactive preview while editing", () => {
    const state = getPreviewToggleState("edit");

    expect(state.active).toBe(false);
    expect(state.nextMode).toBe("interactive");
    expect(state.label).toBe("Preview");
    expect(state.title).toMatch(/interactive preview/i);
  });

  it("offers a way back to editing while previewing", () => {
    const state = getPreviewToggleState("interactive");

    expect(state.active).toBe(true);
    expect(state.nextMode).toBe("edit");
    expect(state.label).toBe("Exit preview");
    expect(state.title).toMatch(/editing/i);
  });
});
