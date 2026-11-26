// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import type { MediaLibraryItem } from "../../../lib/media-library";

vi.mock("../../../hooks/use-media", () => ({
  RECENT_PREVIEW_COUNT: 4,
  RECENT_BOX_SIZE: 8,
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

const ITEM = (id: string, name: string): MediaLibraryItem => ({
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
});

const items = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return ITEM(`media-${number}`, `Media ${number}`);
  });

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(
  total: number,
  data: MediaLibraryItem[] = items(total),
  props: Partial<React.ComponentProps<typeof MediaRecentBox>> = {},
) {
  (useMediaRecent as ReturnType<typeof vi.fn>).mockReturnValue({
    data: { items: data, total },
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

function cards(scope: HTMLElement) {
  return [...scope.querySelectorAll('[aria-label^="More actions for "]')];
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
  it("opens with the four newest Media", () => {
    const scope = mount(8);

    expect(cards(scope).length).toBe(4);
    expect(scope.textContent).toContain("Media 1");
    expect(scope.textContent).toContain("Media 4");
    expect(scope.textContent).not.toContain("Media 5");
  });

  it("is not drawn when there are no active Media", () => {
    const scope = mount(0, []);
    expect(scope.children.length).toBe(0);
  });

  it("is hidden while searching", () => {
    const scope = mount(5, items(5), { search: "query" });
    expect(scope.children.length).toBe(0);
  });

  it("is hidden in the Archived view", () => {
    const scope = mount(5, items(5), { view: "archived" });
    expect(scope.children.length).toBe(0);
  });

  it("hides View more at four or fewer", () => {
    const scope = mount(4);
    expect(scope.textContent).not.toContain("View more");
  });

  it("shows View more when more than four exist", () => {
    const scope = mount(5, items(5));
    expect(scope.textContent).toContain("View more");
  });

  it("reveals the second row on one activation and never grows past eight", async () => {
    const scope = mount(12, items(12));

    await click(scope, "View more");

    expect(cards(scope).length).toBe(8);
    expect(scope.textContent).toContain("Media 8");
    expect(scope.textContent).not.toContain("Media 9");
  });

  it("drops the control at the cap", async () => {
    const scope = mount(12, items(12));

    expect(scope.textContent).toContain("View more");
    await click(scope, "View more");
    expect(scope.textContent).not.toContain("View more");
  });

  it("drops the control when the second row is the last item", async () => {
    const scope = mount(5, items(5));

    await click(scope, "View more");

    expect(cards(scope).length).toBe(5);
    expect(scope.textContent).toContain("Media 5");
    expect(scope.textContent).not.toContain("View more");
  });

  it("renders no pagination and no collapse control", () => {
    const scope = mount(12, items(8));

    expect(scope.textContent).not.toContain("Page ");
    expect(scope.textContent).not.toContain("Previous");
    expect(scope.textContent).not.toContain("Next");
    expect(scope.textContent).not.toContain("Show less");
    expect(scope.textContent).not.toContain("View all");
  });

  it("calls onMove when a card menu requests it", async () => {
    const onMove = vi.fn();
    mount(1, [ITEM("media-1", "Movable")], { onMove });

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
