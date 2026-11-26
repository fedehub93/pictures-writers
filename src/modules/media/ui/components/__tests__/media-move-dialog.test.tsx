// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MediaFolderNode } from "../../../lib/media-folder";
import { MediaMoveDialog } from "../media-move-dialog";

const FOLDERS: MediaFolderNode[] = [
  {
    id: "campaigns",
    name: "Campaigns",
    parentId: null,
    children: [
      {
        id: "spring",
        name: "Spring",
        parentId: "campaigns",
        children: [],
      },
    ],
  },
  { id: "products", name: "Products", parentId: null, children: [] },
];

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount({
  count = 2,
  folders = FOLDERS,
  isPending = false,
  onConfirm = () => undefined,
  onOpenChange = () => undefined,
}: {
  count?: number;
  folders?: MediaFolderNode[];
  isPending?: boolean;
  onConfirm?: (folderId: string | null) => void;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <MediaMoveDialog
        open
        count={count}
        folders={folders}
        isPending={isPending}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );
  });
}

function dialog() {
  return document.querySelector<HTMLElement>('[role="dialog"]');
}

function option(label: string) {
  return (
    [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (candidate) => candidate.textContent?.includes(label),
    ) ?? null
  );
}

function button(label: string) {
  return (
    [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (candidate) => candidate.textContent?.trim().includes(label),
    ) ?? null
  );
}

async function click(target: HTMLElement | null) {
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

describe("MediaMoveDialog", () => {
  it("lists My Drive and every folder as a target", () => {
    mount({ count: 3 });

    const scope = dialog();
    expect(scope).not.toBeNull();
    expect(scope?.textContent).toContain("Move 3 Media");
    expect(scope?.textContent).toContain("My Drive");

    expect(option("Campaigns")).not.toBeNull();
    expect(option("Spring")).not.toBeNull();
    expect(option("Products")).not.toBeNull();
  });

  it("files the selection into the folder the editor picks", async () => {
    const onConfirm = vi.fn();
    mount({ onConfirm });

    await click(option("Spring"));

    // The confirm action names the destination, so the picked folder is not
    // only a highlighted row.
    await click(button("Move to Spring"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("spring");
  });

  it("files at the My Drive root when no folder is picked", async () => {
    const onConfirm = vi.fn();
    mount({ onConfirm });

    await click(button("Move to My Drive"));

    expect(onConfirm).toHaveBeenCalledWith(null);
  });
});
