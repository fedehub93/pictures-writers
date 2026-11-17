// @vitest-environment happy-dom
import type { CustomField } from "@puckeditor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The dialog only needs the tRPC hook to build entity-picker query options;
 * external links do not run a query, so a static fake is enough.
 */
vi.mock("@/trpc/client", () => {
  const queryOptions = (input: unknown) => ({
    queryKey: ["links-dialog-test", input],
    queryFn: () => new Promise<never>(() => undefined),
  });
  const getMany = { getMany: { queryOptions } };

  return {
    useTRPC: () => ({
      pages: getMany,
      posts: getMany,
      products: getMany,
      categories: getMany,
      productCategories: getMany,
    }),
  };
});

import { CopyrightContentField } from "../blocks/Copyright/field";
import type { CopyrightBlockContent } from "../blocks/Copyright/types";
import { LinkListContentField } from "../blocks/LinkList/field";
import type { LinkListBlockContent } from "../blocks/LinkList/types";
import type { LinkListItem } from "../fields/link/types";

const BLOG: LinkListItem = {
  link: { type: "external", url: "/blog/", label: "Blog" },
};

const ABOUT: LinkListItem = {
  link: { type: "page", pageId: "root-about", label: "About" },
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function LinkListHarness({
  initialLinks,
  onLinksChange,
}: {
  initialLinks: LinkListItem[];
  onLinksChange?: (links: LinkListItem[]) => void;
}) {
  const [value, setValue] = useState<LinkListBlockContent>({
    title: "Links",
    links: initialLinks,
  });
  const field = LinkListContentField as CustomField<
    LinkListBlockContent | undefined
  >;

  return field.render({
    field,
    name: "content",
    id: "content",
    value,
    onChange: (next) => {
      setValue(next ?? {});
      onLinksChange?.(next?.links ?? []);
    },
  });
}

function CopyrightHarness({
  initialLinks,
  onLinksChange,
}: {
  initialLinks: LinkListItem[];
  onLinksChange?: (links: LinkListItem[]) => void;
}) {
  const [value, setValue] = useState<CopyrightBlockContent>({
    showYear: true,
    links: initialLinks,
  });
  const field = CopyrightContentField as CustomField<
    CopyrightBlockContent | undefined
  >;

  return field.render({
    field,
    name: "content",
    id: "content",
    value,
    onChange: (next) => {
      setValue(next ?? {});
      onLinksChange?.(next?.links ?? []);
    },
  });
}

function mount(ui: ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
    );
  });

  return container;
}

function mountLinkList(
  links: LinkListItem[],
  onLinksChange?: (links: LinkListItem[]) => void,
) {
  return mount(
    <LinkListHarness initialLinks={links} onLinksChange={onLinksChange} />,
  );
}

async function click(element: Element | undefined | null) {
  expect(element).toBeDefined();

  await act(async () => {
    element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function type(input: HTMLInputElement, text: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;

  act(() => {
    setValue.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function findButton(text: string, scope: ParentNode = document.body) {
  return Array.from(scope.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(text),
  );
}

function dialog() {
  return document.querySelector<HTMLElement>('[role="dialog"]');
}

function listRow(label: string) {
  return Array.from(document.querySelectorAll("li")).find((item) =>
    item.textContent?.includes(label),
  );
}

async function openDialog() {
  await click(findButton("Edit links"));
  expect(dialog()).not.toBeNull();
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("Links dialog", () => {
  it("opens from the panel with the saved links as its draft", async () => {
    mountLinkList([BLOG, ABOUT]);

    await openDialog();

    const scope = dialog()!;

    expect(listRow("Blog")?.textContent).toContain("External URL");
    expect(listRow("About")?.textContent).toContain("Page");

    expect(
      scope.querySelector<HTMLInputElement>("#dialog-link-label")?.value,
    ).toBe("Blog");
    expect(scope.textContent).toContain("Link type");
    expect(scope.textContent).toContain("Open in new tab");

    // The dialog is modal, so focus must stay inside it while open.
    expect(scope.contains(document.activeElement)).toBe(true);
  });

  it("keeps a summary in the panel and no link controls", () => {
    mountLinkList([BLOG, ABOUT]);

    expect(container?.textContent).toContain("2 links");
    expect(container?.textContent).toContain(
      "Edit the links in a dedicated dialog.",
    );
    expect(findButton("Edit links")).toBeDefined();

    expect(container?.textContent).not.toContain("Link type");
    expect(container?.textContent).not.toContain("Open in new tab");
  });

  it("adds a link to the draft and commits the list with Save", async () => {
    const onLinksChange = vi.fn();
    mountLinkList([BLOG], onLinksChange);

    await openDialog();
    await click(findButton("Add link", dialog()!));

    expect(onLinksChange).not.toHaveBeenCalled();
    expect(listRow("Untitled")).toBeDefined();

    await click(findButton("Save", dialog()!));

    expect(dialog()).toBeNull();
    expect(onLinksChange).toHaveBeenCalledTimes(1);

    const saved = onLinksChange.mock.calls[0]?.[0] as LinkListItem[];
    expect(saved).toHaveLength(2);
    expect(saved[0]).toEqual(BLOG);
    expect(saved[1]?.link).toMatchObject({ type: "external", url: "" });

    expect(container?.textContent).toContain("2 links");
  });

  it("removes the selected link and commits the rest on save", async () => {
    const onLinksChange = vi.fn();
    mountLinkList([BLOG, ABOUT], onLinksChange);

    await openDialog();
    await click(findButton("About", dialog()!));
    await click(
      listRow("About")?.querySelector('button[aria-label="Remove link"]'),
    );

    expect(dialog()!.textContent).not.toContain("About");

    await click(findButton("Save", dialog()!));

    const saved = onLinksChange.mock.calls[0]?.[0] as LinkListItem[];
    expect(saved).toHaveLength(1);
    expect(saved[0]).toEqual(BLOG);
  });

  it("reorders the list, keeping the selection and the focused control", async () => {
    const onLinksChange = vi.fn();
    mountLinkList([BLOG, ABOUT], onLinksChange);

    await openDialog();
    await click(findButton("About", dialog()!));

    const scope = dialog()!;
    expect(
      scope.querySelector<HTMLInputElement>("#dialog-link-label")?.value,
    ).toBe("About");

    const moveUp = listRow("About")?.querySelector<HTMLButtonElement>(
      'button[aria-label="Move link up"]',
    );

    moveUp?.focus();
    await click(moveUp);

    // The move must reuse the mounted row, and a control that reaches the edge
    // must stay focusable: a disabled button drops keyboard focus to the body.
    expect(document.activeElement).toBe(moveUp);
    expect(moveUp?.getAttribute("aria-disabled")).toBe("true");
    expect(moveUp?.hasAttribute("disabled")).toBe(false);

    expect(
      dialog()!.querySelector<HTMLInputElement>("#dialog-link-label")?.value,
    ).toBe("About");

    await click(findButton("Save", dialog()!));

    const saved = onLinksChange.mock.calls[0]?.[0] as LinkListItem[];
    expect(saved.map((item) => item.link?.label)).toEqual(["About", "Blog"]);
  });

  it("discards the draft on cancel and reopens from the saved state", async () => {
    const onLinksChange = vi.fn();
    mountLinkList([BLOG], onLinksChange);

    await openDialog();
    await click(findButton("Add link", dialog()!));
    await click(findButton("Cancel", dialog()!));

    expect(dialog()).toBeNull();
    expect(onLinksChange).not.toHaveBeenCalled();
    expect(container?.textContent).toContain("1 link");
    expect(container?.textContent).not.toContain("2 links");

    await openDialog();

    expect(dialog()!.textContent).toContain("Blog");
    expect(listRow("Untitled")).toBeUndefined();
  });

  it("discards the draft on the close button", async () => {
    const onLinksChange = vi.fn();
    mountLinkList([BLOG], onLinksChange);

    await openDialog();
    await click(findButton("Add link", dialog()!));
    await click(findButton("Close", dialog()!));

    expect(dialog()).toBeNull();
    expect(onLinksChange).not.toHaveBeenCalled();

    await openDialog();

    expect(listRow("Untitled")).toBeUndefined();
  });

  it("discards the draft on Escape", async () => {
    const onLinksChange = vi.fn();
    mountLinkList([BLOG], onLinksChange);

    await openDialog();
    await click(findButton("Add link", dialog()!));

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(dialog()).toBeNull();
    expect(onLinksChange).not.toHaveBeenCalled();

    await openDialog();

    expect(listRow("Untitled")).toBeUndefined();
  });

  it("discards the draft on a click on the overlay", async () => {
    const onLinksChange = vi.fn();
    mountLinkList([BLOG], onLinksChange);

    await openDialog();
    await click(findButton("Add link", dialog()!));

    // Radix attaches its outside-pointer listener one macrotask after open,
    // and a modal dialog dismisses on the click that follows the pointerdown.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const overlay = Array.from(
      document.querySelectorAll<HTMLElement>('[data-state="open"]'),
    ).find((element) => element.getAttribute("role") !== "dialog");

    expect(overlay).toBeDefined();

    await act(async () => {
      overlay!.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          composed: true,
          pointerType: "mouse",
        }),
      );
      overlay!.dispatchEvent(
        new MouseEvent("click", { bubbles: true, composed: true }),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(dialog()).toBeNull();
    expect(onLinksChange).not.toHaveBeenCalled();
  });

  it("opens an empty list on an empty state with Add available", async () => {
    mountLinkList([]);

    expect(container?.textContent).toContain("0 links");

    await openDialog();

    const scope = dialog()!;

    expect(scope.textContent).toContain("Add a link to build the list.");
    expect(scope.textContent).toContain(
      "Choose a link from the list or add a new one.",
    );
    expect(findButton("Add link", scope)).toBeDefined();
    expect(scope.querySelector("li")).toBeNull();
  });

  it("reads a legacy stored row through the same normalizer", async () => {
    mountLinkList([{ link: { label: "Legacy", href: "/legacy/" } }]);

    await openDialog();

    expect(listRow("Legacy")?.textContent).toContain("External URL");
    expect(
      dialog()!.querySelector<HTMLInputElement>("#dialog-link-url")?.value,
    ).toBe("/legacy/");
  });

  it("edits one link on the right, not every link at once", async () => {
    mountLinkList([BLOG, ABOUT]);

    await openDialog();

    const scope = dialog()!;

    expect(scope.querySelectorAll("#dialog-link-label")).toHaveLength(1);
    expect(scope.querySelector("#link-1-type")).toBeNull();
  });

  it("keeps a typed edit in the draft until Save", async () => {
    const onLinksChange = vi.fn();
    mountLinkList([BLOG], onLinksChange);

    await openDialog();

    const label = dialog()!.querySelector<HTMLInputElement>("#dialog-link-label")!;

    type(label, "Journal");

    expect(onLinksChange).not.toHaveBeenCalled();

    await click(findButton("Save", dialog()!));

    const saved = onLinksChange.mock.calls[0]?.[0] as LinkListItem[];
    expect(saved[0]?.link?.label).toBe("Journal");
  });

  it("opens the same dialog from the Copyright panel", async () => {
    const onLinksChange = vi.fn();
    mount(
      <CopyrightHarness
        initialLinks={[
          { link: { type: "external", url: "/terms/", label: "Terms" } },
        ]}
        onLinksChange={onLinksChange}
      />,
    );

    expect(container?.textContent).toContain("1 link");
    expect(container?.textContent).not.toContain("Link type");

    await openDialog();

    expect(listRow("Terms")?.textContent).toContain("External URL");

    await click(findButton("Save", dialog()!));

    expect(onLinksChange).toHaveBeenCalledTimes(1);
    expect(onLinksChange.mock.calls[0]?.[0]).toHaveLength(1);
  });
});

