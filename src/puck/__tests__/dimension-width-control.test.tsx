// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import type { DimensionProps } from "../fields/dimension";
import { DimensionView } from "../fields/dimension/ui/view/dimension-view";

/**
 * The Width control has to say what it means. `auto` stays the default, but
 * *Fill* and *Fit content* are explicit choices shown next to the numeric input
 * so the active state is readable without hovering anything.
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
  currentValues?: Partial<DimensionProps>;
  renderValues?: DimensionProps;
  onUpdate?: (values: Partial<DimensionProps>) => void;
}) {
  cleanup();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <DimensionView
        currentValues={overrides.currentValues ?? {}}
        renderValues={overrides.renderValues ?? {}}
        resetProp={() => undefined}
        onUpdate={overrides.onUpdate ?? (() => undefined)}
      />,
    );
  });

  return container;
}

function button(label: string) {
  const match = [...container!.querySelectorAll("button")].find(
    (el) => el.textContent?.trim() === label,
  );
  if (!match) throw new Error(`No button labelled "${label}"`);
  return match;
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function widthInput() {
  return container!.querySelector<HTMLInputElement>('input[name="width"]')!;
}

/** React tracks its own value, so the input has to be typed through the setter. */
function type(input: HTMLInputElement, text: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;

  act(() => {
    setValue.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function pressEnter(input: HTMLInputElement) {
  act(() => {
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });
}

describe("Dimension Width control", () => {
  it("offers Auto, Fill and Fit content next to the numeric input", () => {
    renderView({});

    expect(button("Auto")).not.toBeNull();
    expect(button("Fill")).not.toBeNull();
    expect(button("Fit content")).not.toBeNull();
    expect(widthInput()).not.toBeNull();
  });

  it("shows Auto as the active state when no width is authored", () => {
    renderView({});

    expect(button("Auto").getAttribute("data-state")).toBe("on");
    expect(button("Fill").getAttribute("data-state")).toBe("off");
    expect(button("Fit content").getAttribute("data-state")).toBe("off");
    expect(widthInput().value).toBe("");
  });

  it("writes 100% when Fill is picked", () => {
    const updates: Partial<DimensionProps>[] = [];
    renderView({ onUpdate: (values) => updates.push(values) });

    click(button("Fill"));

    expect(updates.at(-1)).toEqual({ width: "100%" });
  });

  it("writes fit-content when Fit content is picked", () => {
    const updates: Partial<DimensionProps>[] = [];
    renderView({ onUpdate: (values) => updates.push(values) });

    click(button("Fit content"));

    expect(updates.at(-1)).toEqual({ width: "fit-content" });
  });

  it("clears back to unset when Auto is picked", () => {
    const updates: Partial<DimensionProps>[] = [];
    renderView({
      renderValues: { width: "100%" },
      onUpdate: (values) => updates.push(values),
    });

    click(button("Auto"));

    expect(updates.at(-1)).toEqual({ width: undefined });
  });

  it("stores a typed number with the default unit", () => {
    const updates: Partial<DimensionProps>[] = [];
    renderView({ onUpdate: (values) => updates.push(values) });

    type(widthInput(), "24");
    pressEnter(widthInput());

    expect(updates.at(-1)).toEqual({ width: "24px" });
  });

  it("shows the stored value as the active state", () => {
    const cases = [
      { width: "100%", active: "Fill", input: "100" },
      { width: "fit-content", active: "Fit content", input: "fit-content" },
    ];

    for (const { width, active, input } of cases) {
      renderView({ renderValues: { width } });

      for (const label of ["Auto", "Fill", "Fit content"]) {
        expect(
          button(label).getAttribute("data-state"),
          `${width} → ${label}`,
        ).toBe(label === active ? "on" : "off");
      }
      expect(widthInput().value, width).toBe(input);
    }
  });

  it("leaves every state inactive when the width is a custom value", () => {
    renderView({ renderValues: { width: "12rem" } });

    for (const label of ["Auto", "Fill", "Fit content"]) {
      expect(button(label).getAttribute("data-state"), label).toBe("off");
    }
    expect(widthInput().value).toBe("12");
  });
});
