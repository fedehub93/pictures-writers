// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import type { SizeProps } from "../fields/size";
import { SizeView } from "../fields/size/ui/view/size-view";

/**
 * The Width field says what it means without taking a row of its own: the
 * states the style layer can imply are presets of the existing value/unit
 * input, the way Font Size already works.
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
  currentValues?: Partial<SizeProps>;
  renderValues?: SizeProps;
  onUpdate?: (values: Partial<SizeProps>) => void;
  baseWidth?: string;
}) {
  cleanup();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <SizeView
        currentValues={overrides.currentValues ?? {}}
        renderValues={overrides.renderValues ?? {}}
        resetProp={() => undefined}
        onUpdate={overrides.onUpdate ?? (() => undefined)}
        baseWidth={overrides.baseWidth}
      />,
    );
  });
}

function widthInput() {
  return container!.querySelector<HTMLInputElement>('input[name="width"]')!;
}

/** Focusing the field opens its preset menu, exactly like Font Size. */
function openPresets() {
  act(() => {
    widthInput().focus();
  });
}

function preset(label: string) {
  // The preset rows are the only buttons whose bold label is the preset name;
  // selecting by DOM order would also match the Aspect Ratio trigger.
  const match = [...document.querySelectorAll("button")].find(
    (el) => el.querySelector("span.font-semibold")?.textContent?.trim() === label,
  );
  if (!match) throw new Error(`No preset labelled "${label}"`);
  return match;
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
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

describe("Size Width field", () => {
  it("offers Auto, Fill and Fit content as presets of the width input", () => {
    renderView({});
    openPresets();

    expect(preset("Auto").textContent).toContain("no width");
    expect(preset("Fill").textContent).toContain("full width");
    expect(preset("Fit content").textContent).toContain("natural size");
  });

  it("says what Auto inherits when a wider breakpoint set the width", () => {
    // Empty at this breakpoint means "inherit", not "reset the document".
    renderView({ renderValues: { width: "fit-content" } });
    openPresets();

    expect(preset("Auto").textContent).toContain("inherits fit-content");
  });

  it("names the block base width when nothing is inherited", () => {
    // The box resolves to a natural width, so Auto must not claim there is none.
    renderView({ baseWidth: "fit-content" });
    openPresets();

    expect(preset("Auto").textContent).toContain(
      "block default (fit-content)",
    );
    expect(preset("Auto").textContent).not.toContain("no width");
  });

  it("reports the inherited width over the block base width", () => {
    renderView({ baseWidth: "fit-content", renderValues: { width: "50%" } });
    openPresets();

    expect(preset("Auto").textContent).toContain("inherits 50%");
  });

  it("does not claim an inheritance when this breakpoint owns the width", () => {
    renderView({
      currentValues: { width: "fit-content" },
      renderValues: { width: "fit-content" },
    });
    openPresets();

    expect(preset("Auto").textContent).toContain("no width");
  });

  it("stores 100% when Fill is picked", () => {
    const updates: Partial<SizeProps>[] = [];
    renderView({ onUpdate: (values) => updates.push(values) });

    openPresets();
    click(preset("Fill"));

    expect(updates.at(-1)).toEqual({ width: "100%" });
  });

  it("stores fit-content when Fit content is picked", () => {
    const updates: Partial<SizeProps>[] = [];
    renderView({ onUpdate: (values) => updates.push(values) });

    openPresets();
    click(preset("Fit content"));

    expect(updates.at(-1)).toEqual({ width: "fit-content" });
  });

  it("clears back to the block default when Auto is picked", () => {
    const updates: Partial<SizeProps>[] = [];
    renderView({
      baseWidth: "fit-content",
      renderValues: { width: "100%" },
      onUpdate: (values) => updates.push(values),
    });

    openPresets();
    click(preset("Auto"));

    expect(updates.at(-1)).toEqual({ width: undefined });
  });

  it("shows the stored state in the closed field", () => {
    const cases = [
      { width: "100%", input: "100" },
      { width: "fit-content", input: "fit-content" },
    ];

    for (const { width, input } of cases) {
      renderView({ renderValues: { width } });

      expect(widthInput().value, width).toBe(input);
    }
  });

  it("keeps a custom width visible", () => {
    renderView({ renderValues: { width: "12rem" } });

    expect(widthInput().value).toBe("12");
  });

  it("stores a typed number with the default unit", () => {
    const updates: Partial<SizeProps>[] = [];
    renderView({ onUpdate: (values) => updates.push(values) });

    type(widthInput(), "24");
    pressEnter(widthInput());

    expect(updates.at(-1)).toEqual({ width: "24px" });
  });

  it("stores an explicit auto keyword typed by hand, which cancels an inherited width", () => {
    const updates: Partial<SizeProps>[] = [];
    renderView({
      renderValues: { width: "fit-content" },
      onUpdate: (values) => updates.push(values),
    });

    type(widthInput(), "auto");
    pressEnter(widthInput());

    expect(updates.at(-1)).toEqual({ width: "auto" });
  });
});
