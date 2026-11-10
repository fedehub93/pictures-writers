// @vitest-environment happy-dom
import type { ComponentProps } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Config } from "@puckeditor/core";

import {
  editorRootSettingsLabel,
  getEditorRootBreadcrumb,
  getSelectedBlockLabel,
  isEditorRootActive,
} from "../editor/lib/editor-root-entry";
import { EditorRootEntry } from "../editor/ui/components/editor-root-entry";

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

async function renderEntry(props: ComponentProps<typeof EditorRootEntry>) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root!.render(<EditorRootEntry {...props} />);
  });

  return container;
}

function click(element: Element) {
  return act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
});

describe("editor root entry helpers", () => {
  it("treats a missing item selector as the root", () => {
    expect(isEditorRootActive(null)).toBe(true);
    expect(isEditorRootActive(undefined)).toBe(true);
  });

  it("treats any selected item as a block", () => {
    expect(isEditorRootActive({ index: 0 })).toBe(false);
    expect(isEditorRootActive({ index: 2, zone: "content-1" })).toBe(false);
  });

  it("composes the root settings label", () => {
    expect(editorRootSettingsLabel("Page")).toBe("Page settings");
    expect(editorRootSettingsLabel("Header")).toBe("Header settings");
  });

  it("uses the block label and falls back to the component key", () => {
    const config = {
      components: {
        Heading: { label: "Heading" },
        Hero: {},
      },
    } as unknown as Config;

    expect(getSelectedBlockLabel(config, "Heading")).toBe("Heading");
    expect(getSelectedBlockLabel(config, "Hero")).toBe("Hero");
    expect(getSelectedBlockLabel(config, "Missing")).toBe("Missing");
    expect(getSelectedBlockLabel(config, undefined)).toBeNull();
  });

  it("builds the panel breadcrumb", () => {
    expect(getEditorRootBreadcrumb({ rootLabel: "Page" })).toEqual(["Page"]);
    expect(
      getEditorRootBreadcrumb({ rootLabel: "Page", selectedLabel: "Heading" }),
    ).toEqual(["Page", "Heading"]);
    expect(
      getEditorRootBreadcrumb({ rootLabel: "Page", selectedLabel: null }),
    ).toEqual(["Page"]);
  });
});

describe("EditorRootEntry", () => {
  it("shows the settings heading while the root is active", async () => {
    const view = await renderEntry({
      rootLabel: "Page",
      isActive: true,
      onSelectRoot: vi.fn(),
    });

    expect(view.querySelector("h2")?.textContent).toBe("Page settings");
    expect(view.querySelector("button")).toBeNull();
  });

  it("shows document › block and deselects from the document part", async () => {
    const onSelectRoot = vi.fn();
    const view = await renderEntry({
      rootLabel: "Page",
      selectedLabel: "Heading",
      isActive: false,
      onSelectRoot,
    });

    const button = view.querySelector("button");
    const current = view.querySelector('[aria-current="true"]');

    expect(view.querySelector("h2")).toBeNull();
    expect(button!.textContent).toBe("Page");
    expect(current!.textContent).toBe("Heading");

    await click(button!);

    expect(onSelectRoot).toHaveBeenCalledTimes(1);
  });

  it("keeps the document entry when no block label is available", async () => {
    const view = await renderEntry({
      rootLabel: "Footer",
      isActive: false,
      onSelectRoot: vi.fn(),
    });

    expect(view.querySelector("button")!.textContent).toBe("Footer");
    expect(view.querySelector('[aria-current="true"]')).toBeNull();
  });
});
