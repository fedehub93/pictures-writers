// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MediaFolderNode } from "../../../lib/media-folder";
import {
  MediaFolderTree,
  type MediaFolderTreeProps,
} from "../media-folder-tree";

const NODES: MediaFolderNode[] = [
  {
    id: "campaigns",
    name: "Campaigns",
    parentId: null,
    children: [
      {
        id: "spring",
        name: "Spring",
        parentId: "campaigns",
        children: [
          {
            id: "heroes",
            name: "Heroes",
            parentId: "spring",
            children: [],
          },
        ],
      },
    ],
  },
  { id: "products", name: "Products", parentId: null, children: [] },
];

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(
  nodes: MediaFolderNode[],
  props: Partial<
    Pick<MediaFolderTreeProps, "selectedId" | "onSelect">
  > = {},
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <MediaFolderTree
        nodes={nodes}
        onCreateChild={() => undefined}
        onRename={() => undefined}
        onDelete={() => undefined}
        onSelect={() => undefined}
        selectedId={null}
        {...props}
      />,
    );
  });

  return container;
}

function folderButton(scope: HTMLElement, name: string) {
  return (
    [...scope.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === name,
    ) ?? null
  );
}

async function click(scope: HTMLElement, selector: string) {
  const target = scope.querySelector<HTMLElement>(selector);
  expect(target).not.toBeNull();

  await act(async () => {
    target!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("MediaFolderTree", () => {
  it("renders the root folders and reveals nested ones when expanded", async () => {
    const scope = mount(NODES);

    expect(scope.textContent).toContain("Campaigns");
    expect(scope.textContent).toContain("Products");
    expect(scope.textContent).not.toContain("Spring");
    expect(scope.textContent).not.toContain("Heroes");

    await click(scope, '[aria-label="Expand Campaigns"]');

    expect(scope.textContent).toContain("Spring");
    expect(scope.textContent).not.toContain("Heroes");
    expect(scope.querySelector('[aria-label="Collapse Campaigns"]')).not.toBeNull();

    await click(scope, '[aria-label="Expand Spring"]');

    expect(scope.textContent).toContain("Heroes");
  });

  it("renders a folder without children as a leaf with no expand control", () => {
    const scope = mount(NODES);

    expect(scope.querySelector('[aria-label="Expand Products"]')).toBeNull();
  });

  it("opens the folder whose name the editor clicks", async () => {
    const onSelect = vi.fn();
    const scope = mount(NODES, { onSelect });

    const target = folderButton(scope, "Products");
    expect(target).not.toBeNull();

    await act(async () => {
      target!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "products" }),
    );
  });

  it("marks the open folder so the editor sees where they are", () => {
    const scope = mount(NODES, { selectedId: "products" });

    const selected = scope.querySelector('[aria-current="page"]');
    expect(selected).not.toBeNull();
    expect(selected?.textContent).toContain("Products");
  });
});
