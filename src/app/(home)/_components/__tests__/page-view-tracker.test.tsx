// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/blog/post/",
  useSearchParams: () => new URLSearchParams({ ref: "newsletter" }),
}));

import { PageViewTracker } from "../page-view-tracker";

describe("PageViewTracker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.dataLayer;
  });

  it("queues a page_view without any consent-default script", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<PageViewTracker />);
    });

    const dataLayer = window.dataLayer ?? [];
    expect(dataLayer).toEqual([
      expect.objectContaining({
        event: "page_view",
        page_path: "/blog/post/?ref=newsletter",
      }),
    ]);

    await act(async () => {
      root.unmount();
    });
  });
});
