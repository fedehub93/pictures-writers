// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";

import {
  BYTES_PER_MEGABYTE,
  mediaQuotaStatus,
  type MediaTypeUsage,
} from "@/modules/media/lib/quota";
import { MediaStorageDetails } from "@/modules/media/ui/components/media-storage-details";

const MB = BYTES_PER_MEGABYTE;

const BY_TYPE: MediaTypeUsage[] = [
  { type: MediaType.IMAGE, count: 3, bytes: 2 * MB },
  { type: MediaType.VIDEO, count: 1, bytes: 4 * MB },
  { type: MediaType.AUDIO, count: 0, bytes: 0 },
  { type: MediaType.FILE, count: 2, bytes: 1 * MB },
];

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(quotaMb: number, usedBytes: number) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <MediaStorageDetails
        quota={mediaQuotaStatus(usedBytes, quotaMb)}
        byMediaType={BY_TYPE}
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

describe("MediaStorageDetails", () => {
  it("shows total usage and the breakdown by Media type", () => {
    const scope = mount(10, 8.5 * MB);
    const text = scope.textContent ?? "";

    expect(text).toContain("8.5 MiB of 10 MiB");
    expect(text).toContain("85%");

    expect(text).toContain("Images");
    expect(text).toContain("3 files");
    expect(text).toContain("2 MiB");
    expect(text).toContain("Videos");
    expect(text).toContain("1 file");
    expect(text).toContain("4 MiB");
    expect(text).toContain("Audio");
    expect(text).toContain("0 files");
    expect(text).toContain("0 Bytes");
    expect(text).toContain("Documents");
    expect(text).toContain("2 files");
    expect(text).toContain("1 MiB");

    const progress = scope.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute("aria-valuemin")).toBe("0");
    expect(progress?.getAttribute("aria-valuemax")).toBe("100");
    expect(progress?.getAttribute("aria-valuenow")).toBe("85");
  });

  it("warns when usage is above the warning ratio", () => {
    const scope = mount(10, 8.5 * MB);

    expect(scope.textContent).toContain(
      "Storage is above the warning threshold.",
    );
  });

  it("does not warn below the warning ratio", () => {
    const scope = mount(10, 2 * MB);

    expect(scope.textContent).not.toContain(
      "Storage is above the warning threshold.",
    );
  });
});
