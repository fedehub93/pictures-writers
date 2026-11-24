// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import type { MediaFolderNode } from "../../../lib/media-folder";
import { MediaFolderTree } from "../media-folder-tree";

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

function mount(nodes: MediaFolderNode[]) {
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
      />,
    );
  });

  return container;
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
});
