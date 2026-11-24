// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import type { MediaLibraryEntry } from "../../../lib/media-library";

// The card offers the menu here; its own mutations and the admin modal store
// are not part of this surface.
vi.mock("@/trpc/client", () => {
  const mutationOptions = () => ({
    mutationFn: async () => undefined,
  });

  return {
    useTRPC: () => ({
      media: {
        archive: { mutationOptions },
        restore: { mutationOptions },
        removeMany: { mutationOptions },
      },
    }),
  };
});

vi.mock("@/modules/media/hooks/use-media-invalidation", () => ({
  useMediaInvalidation: () => ({ invalidateLibrary: async () => undefined }),
}));

vi.mock("@/app/(admin)/_hooks/use-modal-store", () => ({
  useModal: () => ({ onOpen: () => undefined }),
}));

import { MediaCard } from "../media-card";

const MEDIA: MediaLibraryEntry = {
  id: "media-1",
  name: "Probe move",
  type: MediaType.FILE,
  altText: null,
  revision: 1,
  metadata: null,
  archivedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  key: null,
  url: "",
  size: 128,
  mimeType: "application/pdf",
  checksum: "checksum",
  storageDriver: "local",
  usageCount: 0,
};

const ARCHIVED_MEDIA: MediaLibraryEntry = {
  ...MEDIA,
  id: "media-2",
  name: "Archived probe",
  archivedAt: new Date("2026-01-02T00:00:00Z"),
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(
  media: MediaLibraryEntry,
  props: Partial<
    Pick<
      React.ComponentProps<typeof MediaCard>,
      | "selectable"
      | "allowsSelection"
      | "showArchivedBadge"
      | "checked"
      | "selected"
    >
  > = {},
  onMove = () => undefined,
  onSelect = () => undefined,
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <QueryClientProvider client={new QueryClient()}>
        <MediaCard
          media={media}
          checked={false}
          selected={false}
          onCheckboxChange={() => undefined}
          onSelect={onSelect}
          onMove={onMove}
          {...props}
        />
      </QueryClientProvider>,
    );
  });
}

function menuTrigger() {
  return document.querySelector<HTMLButtonElement>(
    '[aria-label="More actions for Probe move"]',
  );
}

function archivedMenuTrigger() {
  return document.querySelector<HTMLButtonElement>(
    '[aria-label="More actions for Archived probe"]',
  );
}

async function press(target: HTMLElement | null) {
  expect(target).not.toBeNull();

  await act(async () => {
    target!.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerType: "mouse",
      }),
    );
    target!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function openMenu(trigger: HTMLElement | null) {
  await press(trigger);
  return [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("MediaCard menu", () => {
  it("offers Edit, Replace, Move to folder and Archive for active Media", async () => {
    mount(MEDIA);

    const items = await openMenu(menuTrigger());
    const labels = items.map((item) => item.textContent);

    expect(labels).toContain("Edit");
    expect(labels).toContain("Replace");
    expect(labels).toContain("Move to folder");
    expect(labels).toContain("Archive");
    expect(labels).not.toContain("Restore");
    expect(labels).not.toContain("Delete permanently");
  });

  it("offers Restore and Delete permanently for archived Media", async () => {
    mount(ARCHIVED_MEDIA, { showArchivedBadge: true });

    const items = await openMenu(archivedMenuTrigger());
    const labels = items.map((item) => item.textContent);

    expect(labels).toContain("Restore");
    expect(labels).toContain("Delete permanently");
    expect(labels).not.toContain("Edit");
    expect(labels).not.toContain("Archive");
  });

  it("opens the folder picker from the card's action menu", async () => {
    const onMove = vi.fn();
    mount(MEDIA, {}, onMove);

    const items = await openMenu(menuTrigger());
    const moveItem = items.find((item) =>
      item.textContent?.includes("Move to folder"),
    );
    expect(moveItem).not.toBeUndefined();

    await act(async () => {
      moveItem!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith("media-1");
  });
});

describe("MediaCard selection", () => {
  it("reports the Media it shows when the card is clicked", async () => {
    const onSelect = vi.fn();
    mount(MEDIA, {}, () => undefined, onSelect);

    const card = document.querySelector<HTMLElement>(
      '[data-media-id="media-1"]',
    );
    expect(card).not.toBeNull();

    await act(async () => {
      card!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("media-1");
  });

  it("selects the Media from its name for keyboard users", async () => {
    const onSelect = vi.fn();
    mount(MEDIA, {}, () => undefined, onSelect);

    const name = document.querySelector<HTMLButtonElement>(
      '[aria-label="View details for Probe move"]',
    );
    expect(name).not.toBeNull();

    await act(async () => {
      name!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("media-1");
  });

  it("does not report a selection when the menu is opened", async () => {
    const onSelect = vi.fn();
    mount(MEDIA, {}, () => undefined, onSelect);

    await openMenu(menuTrigger());

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not report a selection when the checkbox is toggled", async () => {
    const onSelect = vi.fn();
    const onCheckboxChange = vi.fn();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root!.render(
        <QueryClientProvider client={new QueryClient()}>
          <MediaCard
            media={MEDIA}
            checked={false}
            selected={false}
            onCheckboxChange={onCheckboxChange}
            onSelect={onSelect}
            onMove={() => undefined}
          />
        </QueryClientProvider>,
      );
    });

    const checkbox = document.querySelector<HTMLButtonElement>(
      '[aria-label="Select Probe move"]',
    );
    expect(checkbox).not.toBeNull();

    await act(async () => {
      checkbox!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onCheckboxChange).toHaveBeenCalledTimes(1);
  });

  it("is not selectable when allowsSelection is false", async () => {
    const onSelect = vi.fn();
    mount(MEDIA, { allowsSelection: false }, () => undefined, onSelect);

    const card = document.querySelector<HTMLElement>(
      '[data-media-id="media-1"]',
    );
    expect(card).not.toBeNull();

    await act(async () => {
      card!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
