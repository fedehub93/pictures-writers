// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MediaFolderSummary } from "../../../lib/media-folder";
import { MediaFolderCard } from "../media-folder-card";

const FOLDER: MediaFolderSummary = {
  id: "campaigns",
  name: "Campaigns",
  parentId: null,
  mediaCount: 3,
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(
  folder: MediaFolderSummary,
  onOpen: (folderId: string) => void,
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(<MediaFolderCard folder={folder} onOpen={onOpen} />);
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

describe("MediaFolderCard", () => {
  it("renders the folder name and how many Media it holds", () => {
    const scope = mount(FOLDER, () => undefined);

    expect(scope.textContent).toContain("Campaigns");
    expect(scope.textContent).toContain("3 items");
    expect(scope.textContent).not.toContain("Folder");
  });

  it("counts one Media in the singular", () => {
    const scope = mount({ ...FOLDER, mediaCount: 1 }, () => undefined);

    expect(scope.textContent).toContain("1 item");
    expect(scope.textContent).not.toContain("1 items");
  });

  it("opens the folder the card names when clicked", async () => {
    const onOpen = vi.fn();
    const scope = mount(FOLDER, onOpen);

    await click(scope, 'button[aria-label="Open Campaigns"]');

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith("campaigns");
  });
});
