// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import type { MediaFolderDetails } from "../../../lib/media-folder";
import type { MediaLibraryItem } from "../../../lib/media-library";

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
        moveMedia: { mutationOptions },
      },
    }),
    useTRPCClient: () => ({}),
  };
});

vi.mock("@/modules/media/hooks/use-media-invalidation", () => ({
  useMediaInvalidation: () => ({ invalidateLibrary: async () => undefined }),
}));

vi.mock("@/modules/media/hooks/use-media", () => ({
  useMediaFolderTree: () => ({ data: [] }),
}));

vi.mock("@/app/(admin)/_hooks/use-modal-store", () => ({
  useModal: () => ({ onOpen: () => undefined }),
}));

import { MediaLibraryPanel } from "../media-library-panel";

const MEDIA: MediaLibraryItem = {
  id: "media-1",
  name: "Panel item",
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
};

const FOLDER: MediaFolderDetails = {
  id: "campaigns",
  name: "Campaigns",
  parentId: null,
  mediaCount: 3,
  totalSize: 4096,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(
  props: Partial<React.ComponentProps<typeof MediaLibraryPanel>> = {},
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <QueryClientProvider client={new QueryClient()}>
        <MediaLibraryPanel
          items={[MEDIA]}
          folders={[]}
          folder={null}
          folderPending={false}
          view="active"
          sort="created"
          onSortChange={() => undefined}
          hasMore={false}
          isLoadingMore={false}
          folderTree={[]}
          onLoadMore={() => undefined}
          onOpenFolder={() => undefined}
          onRequestMove={() => undefined}
          checkedIds={[]}
          onCheckedIdsChange={() => undefined}
          {...props}
        />
      </QueryClientProvider>,
    );
  });

  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("MediaLibraryPanel", () => {
  it("shows the My Drive title at the root", () => {
    const scope = mount();

    expect(scope.textContent).toContain("My Drive");
    expect(scope.textContent).not.toContain("Archived");
  });

  it("shows the Archived title in the archived view", () => {
    const scope = mount({ view: "archived" });

    expect(scope.textContent).toContain("Archived");
    expect(scope.textContent).not.toContain("My Drive");
  });

  it("shows the sort control in the archived view", () => {
    const scope = mount({ view: "archived" });

    expect(scope.querySelector('[aria-label="Sort by"]')).not.toBeNull();
  });

  it("shows no usage note", () => {
    const scope = mount();

    expect(scope.textContent).not.toContain("relational references");
    expect(scope.textContent).not.toContain("rich text");
  });

  it("renders View more when another block exists", () => {
    const scope = mount({ hasMore: true });
    expect(scope.textContent).toContain("View more");
  });

  it("does not render View more at the end of the list", () => {
    const scope = mount({ hasMore: false });
    expect(scope.textContent).not.toContain("View more");
  });

  it("asks for the next block when View more is activated", async () => {
    const onLoadMore = vi.fn();
    const scope = mount({ hasMore: true, onLoadMore });

    const button = [...scope.querySelectorAll("button")].find((candidate) =>
      candidate.textContent?.includes("View more"),
    );
    expect(button).not.toBeNull();

    await act(async () => {
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("shows the loading state while the next block loads", () => {
    const scope = mount({ hasMore: true, isLoadingMore: true });

    const button = [...scope.querySelectorAll("button")].find((candidate) =>
      candidate.textContent?.includes("View more"),
    );
    expect(button?.disabled).toBe(true);
    expect(button?.getAttribute("aria-busy")).toBe("true");
  });

  it("shows the bulk action slot when a card is checked", async () => {
    const onCheckedIdsChange = vi.fn();
    const scope = mount({
      onCheckedIdsChange,
      checkedIds: [],
    });

    expect(scope.textContent).not.toContain("Move to folder");

    const checkbox = scope.querySelector<HTMLButtonElement>(
      '[aria-label="Select Panel item"]',
    );
    expect(checkbox).not.toBeNull();

    await act(async () => {
      checkbox!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onCheckedIdsChange).toHaveBeenCalledWith(["media-1"]);
  });

  it("exposes the sort control by its accessible name and reports a change", async () => {
    const onSortChange = vi.fn();
    const scope = mount({ onSortChange });

    const trigger = scope.querySelector<HTMLButtonElement>(
      '[aria-label="Sort by"]',
    );
    expect(trigger).not.toBeNull();
    expect(trigger!.textContent).toContain("Created");

    await act(async () => {
      trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const content = document.getElementById(
      trigger!.getAttribute("aria-controls") ?? "",
    );
    expect(content).not.toBeNull();

    const option = [
      ...content!.querySelectorAll<HTMLElement>('[role="option"]'),
    ].find((candidate) => candidate.textContent?.includes("Name"));
    expect(option).not.toBeUndefined();

    await act(async () => {
      option!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSortChange).toHaveBeenCalledWith("name");
  });

  it("renders the breadcrumb with the open folder", () => {
    const scope = mount({
      folder: FOLDER,
      folderTree: [
        {
          id: "campaigns",
          name: "Campaigns",
          parentId: null,
          children: [],
        },
      ],
    });

    expect(scope.textContent).toContain("My Drive");
    expect(scope.textContent).toContain("Campaigns");
  });
});
