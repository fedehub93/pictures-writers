// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SpacingProps } from "../fields/spacing";
import { SpacingView } from "../fields/spacing/ui/view/spacing-view";

/**
 * The Spacing field is a peer of Size: it holds the four margins and the four
 * paddings as two labelled groups, with the same reset dot on every property
 * authored at the selected Breakpoint.
 */
let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function cleanup() {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
}

afterEach(cleanup);

function renderView(overrides: {
  currentValues?: Partial<SpacingProps>;
  renderValues?: SpacingProps;
  onUpdate?: (values: Partial<SpacingProps>) => void;
  resetProp?: (key: keyof SpacingProps) => void;
}) {
  cleanup();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <SpacingView
        currentValues={overrides.currentValues ?? {}}
        renderValues={overrides.renderValues ?? {}}
        resetProp={overrides.resetProp ?? (() => undefined)}
        onUpdate={overrides.onUpdate ?? (() => undefined)}
      />,
    );
  });
}

/** The group wrapper that carries a given label. */
function group(label: "Margin" | "Padding") {
  const heading = [...container!.querySelectorAll("span")].find(
    (el) => el.textContent?.trim() === label,
  );
  if (!heading) throw new Error(`No group labelled "${label}"`);

  return heading.parentElement!;
}

function inputNames(scope: HTMLElement) {
  return [...scope.querySelectorAll("input")].map((input) => input.name);
}

function resetButtons(scope: HTMLElement) {
  return [...scope.querySelectorAll("button[title='Reset to default']")];
}

describe("Spacing view", () => {
  it("shows a Margin group above a Padding group", () => {
    renderView({});

    const labels = [...container!.querySelectorAll("span")]
      .map((el) => el.textContent?.trim())
      .filter((label) => label === "Margin" || label === "Padding");

    expect(labels).toEqual(["Margin", "Padding"]);
  });

  it("offers Top, Right, Bottom and Left in each group", () => {
    renderView({});

    expect(inputNames(group("Margin"))).toEqual([
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
    ]);
    expect(inputNames(group("Padding"))).toEqual([
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
    ]);
  });

  it("shows the value inherited from a wider breakpoint without a reset", () => {
    renderView({ renderValues: { marginTop: "12px", paddingLeft: "8px" } });

    expect(
      group("Margin").querySelector<HTMLInputElement>(
        'input[name="marginTop"]',
      )!.value,
    ).toBe("12");
    expect(
      group("Padding").querySelector<HTMLInputElement>(
        'input[name="paddingLeft"]',
      )!.value,
    ).toBe("8");

    // Nothing is authored at this breakpoint, so nothing claims a reset.
    expect(resetButtons(container!)).toHaveLength(0);
  });

  it("offers a reset only on the properties authored at this breakpoint", () => {
    renderView({ currentValues: { marginTop: "12px", paddingLeft: "8px" } });

    const buttons = resetButtons(container!);

    expect(buttons).toHaveLength(2);
    expect(
      buttons.map((button) => button.closest("div")?.textContent),
    ).toEqual([
      expect.stringContaining("Top"),
      expect.stringContaining("Left"),
    ]);
  });

  it("resets the property the author clicked", () => {
    const resetProp = vi.fn();

    renderView({ currentValues: { marginBottom: "4px" }, resetProp });

    const paddingResets = resetButtons(group("Padding"));
    expect(paddingResets).toHaveLength(0);

    act(() => {
      resetButtons(group("Margin"))[0]!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(resetProp).toHaveBeenCalledWith("marginBottom");
  });
});
