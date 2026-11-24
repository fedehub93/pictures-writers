// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import type { MediaLibraryEntry } from "../../../lib/media-library";

// The card only offers the folder picker here; its own mutations and the
// admin modal store are not part of this surface.
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

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(onMove = () => undefined) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <QueryClientProvider client={new QueryClient()}>
        <MediaCard
          media={MEDIA}
          checked={false}
          onCheckboxChange={() => undefined}
          onMove={onMove}
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

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("MediaCard move action", () => {
  it("offers the folder picker from the card's action menu", async () => {
    const onMove = vi.fn();
    mount(onMove);

    await press(menuTrigger());

    const item = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find((candidate) => candidate.textContent?.includes("Move to folder"));

    expect(item).not.toBeUndefined();

    await act(async () => {
      item!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith("media-1");
  });
});
