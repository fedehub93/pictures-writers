// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import type { MediaFolderDetails } from "../../../lib/media-folder";
import type { MediaLibraryEntry } from "../../../lib/media-library";
import { MediaDetailsPanel } from "../media-details-panel";

const CREATED_AT = new Date("2026-01-02T10:00:00Z");
const UPDATED_AT = new Date("2026-02-03T11:30:00Z");

const MEDIA: MediaLibraryEntry = {
  id: "media-1",
  name: "Campaign cover",
  type: MediaType.IMAGE,
  altText: "A campaign cover",
  revision: 2,
  metadata: { width: 1920, height: 1080 },
  archivedAt: null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  key: "demo/media-1/2/original",
  url: "/media/demo/media-1/2/original",
  size: 2048,
  mimeType: "image/webp",
  checksum: "abc123checksum",
  storageDriver: "local",
  usageCount: 3,
};

const FOLDER: MediaFolderDetails = {
  id: "campaigns",
  name: "Campaigns",
  parentId: null,
  mediaCount: 3,
  totalSize: 4096,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(
  media: MediaLibraryEntry | null,
  folder: MediaFolderDetails | null,
  folderPending = false,
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <MediaDetailsPanel
        media={media}
        folder={folder}
        folderPending={folderPending}
      />,
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

describe("MediaDetailsPanel", () => {
  it("shows the details of the selected Media", () => {
    const scope = mount(MEDIA, null);
    const text = scope.textContent ?? "";

    expect(text).toContain("Campaign cover");
    expect(text).toContain(MediaType.IMAGE);
    expect(text).toContain("2 KiB");
    expect(text).toContain("1920 × 1080");
    expect(text).toContain("image/webp");
    expect(text).toContain("abc123checksum");
    expect(text).toContain("local");
    expect(text).toContain("3 relational references");
    expect(text).toContain("/media/demo/media-1/2/original");
    expect(text).toContain("2 gen 2026");
    expect(text).toContain("3 feb 2026");
  });

  it("shows the details of the folder the editor opened", () => {
    const scope = mount(null, FOLDER);
    const text = scope.textContent ?? "";

    expect(text).toContain("Campaigns");
    expect(text).toContain("3 items");
    expect(text).toContain("4 KiB");
    expect(text).toContain("2 gen 2026");
    expect(text).toContain("3 feb 2026");
  });

  it("updates when the selection changes", () => {
    const scope = mount(MEDIA, null);
    expect(scope.textContent).toContain("Campaign cover");

    act(() => {
      root!.render(<MediaDetailsPanel media={null} folder={FOLDER} />);
    });

    expect(scope.textContent).toContain("Campaigns");
    expect(scope.textContent).not.toContain("Campaign cover");
  });

  it("does not show the placeholder while the open folder is loading", () => {
    const scope = mount(null, null, true);

    expect(scope.textContent).toContain("Loading folder details");
    expect(scope.textContent).not.toContain(
      "Select a Media or folder to see its details.",
    );
  });

  it("shows a placeholder when nothing is selected", () => {
    const scope = mount(null, null);

    expect(scope.textContent).toContain(
      "Select a Media or folder to see its details.",
    );
  });
});
