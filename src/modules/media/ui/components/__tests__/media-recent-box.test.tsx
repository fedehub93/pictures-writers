// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import type { MediaLibraryEntry } from "../../../lib/media-library";

vi.mock("../../../hooks/use-media", () => ({
  RECENT_PREVIEW_COUNT: 4,
  RECENT_PAGE_SIZE: 8,
  useMediaRecent: vi.fn(),
}));

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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMediaRecent } from "../../../hooks/use-media";
import { MediaRecentBox } from "../media-recent-box";

const ITEM = (id: string, name: string): MediaLibraryEntry => ({
  id,
  name,
  type: MediaType.IMAGE,
  altText: null,
  revision: 1,
  metadata: null,
  archivedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  key: null,
  url: "/media/test",
  size: 1024,
  mimeType: "image/webp",
  checksum: "abc",
  storageDriver: "local",
  usageCount: 0,
});

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(
  total: number,
  items: MediaLibraryEntry[] = [],
  props: Partial<Omit<React.ComponentProps<typeof MediaRecentBox>, "onMove">> = {},
) {
  (useMediaRecent as ReturnType<typeof vi.fn>).mockReturnValue({
    data: { items, total, totalPages: Math.ceil(total / 8) },
  });

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <QueryClientProvider client={new QueryClient()}>
        <MediaRecentBox
          view="active"
          search=""
          onMove={() => undefined}
          {...props}
        />
      </QueryClientProvider>,
    );
  });

  return container;
}

async function click(scope: HTMLElement, text: string) {
  const target = [...scope.querySelectorAll("button")].find((button) =>
    button.textContent?.includes(text),
  );
  expect(target).not.toBeUndefined();

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
  vi.clearAllMocks();
});

describe("MediaRecentBox", () => {
  it("shows up to four recent Media", () => {
    const scope = mount(
      4,
      [1, 2, 3, 4].map((i) => ITEM(`media-${i}`, `Media ${i}`)),
    );

    expect(scope.textContent).toContain("Media 1");
    expect(scope.textContent).toContain("Media 4");
    expect(scope.textContent).not.toContain("View all");
  });

  it("is not drawn when there are no active Media", () => {
    const scope = mount(0, []);
    expect(scope.children.length).toBe(0);
  });

  it("is hidden while searching", () => {
    const scope = mount(
      4,
      [1, 2, 3, 4].map((i) => ITEM(`media-${i}`, `Media ${i}`)),
      { search: "query" },
    );
    expect(scope.children.length).toBe(0);
  });

  it("is hidden in the Archived view", () => {
    const scope = mount(
      4,
      [1, 2, 3, 4].map((i) => ITEM(`media-${i}`, `Media ${i}`)),
      { view: "archived" },
    );
    expect(scope.children.length).toBe(0);
  });

  it("shows View all only when more than four exist", () => {
    const scope = mount(
      5,
      [1, 2, 3, 4, 5].map((i) => ITEM(`media-${i}`, `Media ${i}`)),
    );

    expect(scope.textContent).toContain("View all");
  });

  it("expands to the full list and paginates", async () => {
    const scope = mount(
      10,
      [1, 2, 3, 4].map((i) => ITEM(`media-${i}`, `Media ${i}`)),
    );

    expect(scope.textContent).toContain("View all");
    expect(scope.textContent).not.toContain("Show less");

    await click(scope, "View all");

    expect(scope.textContent).toContain("Show less");
    expect(scope.textContent).toContain("Page 1 of 2");
  });

  it("calls onMove when a card menu requests it", async () => {
    const onMove = vi.fn();
    (useMediaRecent as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        items: [ITEM("media-1", "Movable")],
        total: 1,
        totalPages: 1,
      },
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root!.render(
        <QueryClientProvider client={new QueryClient()}>
          <MediaRecentBox view="active" search="" onMove={onMove} />
        </QueryClientProvider>,
      );
    });

    const trigger = document.querySelector<HTMLButtonElement>(
      '[aria-label="More actions for Movable"]',
    );
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger!.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          pointerType: "mouse",
        }),
      );
      trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const item = [
      ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ].find((candidate) =>
      candidate.textContent?.includes("Move to folder"),
    );
    expect(item).not.toBeUndefined();

    await act(async () => {
      item!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onMove).toHaveBeenCalledWith("media-1");
  });
});
