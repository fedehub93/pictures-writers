// @vitest-environment happy-dom
import type { CustomField } from "@puckeditor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The dialog only needs the tRPC hook to build entity-picker query options;
 * external links do not run a query, so a static fake is enough.
 */
vi.mock("@/trpc/client", () => {
  const queryOptions = (input: unknown) => ({
    queryKey: ["navbar-items-dialog-test", input],
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

/**
 * The icon picker opens its own popover; the dialog only needs to prove the
 * shared Icon field is offered with the stored value.
 */
vi.mock("@/puck/fields/icon/ui/view/icon-view", () => ({
  IconView: ({ state }: { state?: { name?: string } }) => (
    <span data-testid="icon-view">{state?.name ?? "none"}</span>
  ),
}));

import { NavbarContentField } from "../blocks/NavbarBlock/field";
import type {
  NavItem,
  NavbarBlockContent,
} from "../blocks/NavbarBlock/types";

const LINK_HOME: NavItem = {
  type: "link",
  label: "Home",
  link: { type: "external", url: "/" },
};

const COLUMN_RISORSE: NavItem = {
  type: "column",
  label: "Risorse",
  items: [],
};

const COLUMN_WITH_CHILD: NavItem = {
  type: "column",
  label: "Risorse",
  items: [
    {
      label: "Blog",
      description: "Articoli e approfondimenti.",
      icon: { name: "newspaper" },
      link: { type: "external", url: "/blog/" },
    },
  ],
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function FieldHarness({
  initialItems,
  onItemsChange,
}: {
  initialItems: NavItem[];
  onItemsChange?: (items: NavItem[]) => void;
}) {
  const [value, setValue] = useState<NavbarBlockContent>({
    layout: "mega",
    items: initialItems,
  });
  const field = NavbarContentField as CustomField<
    NavbarBlockContent | undefined
  >;

  return field.render({
    field,
    name: "content",
    id: "content",
    value,
    onChange: (next) => {
      setValue(next ?? {});
      onItemsChange?.(next?.items ?? []);
    },
  });
}

function mount(items: NavItem[], onItemsChange?: (items: NavItem[]) => void) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <QueryClientProvider client={new QueryClient()}>
        <FieldHarness initialItems={items} onItemsChange={onItemsChange} />
      </QueryClientProvider>,
    );
  });

  return container;
}

async function click(element: Element | undefined) {
  expect(element).toBeDefined();

  await act(async () => {
    element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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
  await click(findButton("Edit items"));
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

describe("Menu items dialog", () => {
  it("opens from the field summary and shows the two panes", async () => {
    mount([LINK_HOME, COLUMN_RISORSE]);

    await openDialog();

    const scope = dialog()!;

    expect(scope.textContent).toContain("Menu items");
    expect(scope.textContent).toContain("Add link");
    expect(scope.textContent).toContain("Add column");
    expect(scope.textContent).toContain("Add card");
    expect(scope.textContent).toContain("Add CTA");

    // Left column rows show the type and the label.
    expect(listRow("Home")?.textContent).toContain("Link");
    expect(listRow("Risorse")?.textContent).toContain("Column");

    // Right pane edits the selected item.
    expect(scope.textContent).toContain("Destination");
    expect(scope.querySelector("#navbar-item-label")).not.toBeNull();

    // The dialog is modal, so focus must stay inside it while open.
    expect(scope.contains(document.activeElement)).toBe(true);
  });

  it("shows the fields that belong to the selected item type", async () => {
    mount([
      {
        type: "card",
        label: "Workbook",
        description: "Una guida pratica.",
        icon: { name: "book-open" },
        link: { type: "external", url: "/shop/workbook/" },
      },
      {
        type: "cta",
        label: "Contatti",
        link: { type: "external", url: "/contatti/" },
        variant: "primary",
      },
      COLUMN_RISORSE,
    ]);

    await openDialog();

    expect(dialog()!.textContent).toContain("Description");
    expect(dialog()!.textContent).toContain("Icon");
    expect(dialog()!.textContent).toContain("Destination");

    await click(findButton("Contatti"));
    expect(dialog()!.textContent).toContain("Variant");
    expect(dialog()!.textContent).not.toContain("Icon");

    await click(findButton("Risorse"));
    expect(dialog()!.textContent).toContain("Column links");
    expect(dialog()!.textContent).not.toContain("Destination");
  });

  it("edits description and icon on column children", async () => {
    mount([COLUMN_WITH_CHILD]);

    await openDialog();

    const scope = dialog()!;

    expect(scope.textContent).toContain("Column links");
    expect(
      scope
        .querySelector("#navbar-column-description-0")
        ?.getAttribute("placeholder"),
    ).toBe("Short description shown next to the link");
    expect(scope.textContent).toContain("Articoli e approfondimenti.");
    expect(scope.textContent).toContain("Icon");
    expect(scope.textContent).toContain("newspaper");
  });

  it("adds an item and applies the draft on save", async () => {
    const onItemsChange = vi.fn();
    mount([LINK_HOME], onItemsChange);

    await openDialog();
    await click(findButton("Add column", dialog()!));

    expect(dialog()!.textContent).toContain("Column links");
    expect(onItemsChange).not.toHaveBeenCalled();

    await click(findButton("Save", dialog()!));

    expect(dialog()).toBeNull();
    expect(onItemsChange).toHaveBeenCalledTimes(1);

    const saved = onItemsChange.mock.calls[0]?.[0] as NavItem[];
    expect(saved).toHaveLength(2);
    expect(saved[1]?.type).toBe("column");

    expect(container?.textContent).toContain("2 items");
  });

  it("removes an item and applies the draft on save", async () => {
    const onItemsChange = vi.fn();
    mount([LINK_HOME, COLUMN_RISORSE], onItemsChange);

    await openDialog();
    await click(findButton("Risorse"));
    await click(listRow("Risorse")?.querySelector('button[aria-label="Remove item"]') ?? undefined);

    expect(dialog()!.textContent).not.toContain("Risorse");

    await click(findButton("Save", dialog()!));

    const saved = onItemsChange.mock.calls[0]?.[0] as NavItem[];
    expect(saved).toHaveLength(1);
    expect(saved[0]?.label).toBe("Home");
  });

  it("reorders items and applies the draft on save", async () => {
    const onItemsChange = vi.fn();
    mount([LINK_HOME, COLUMN_RISORSE], onItemsChange);

    await openDialog();
    await click(findButton("Risorse"));
    const moveUp = listRow("Risorse")?.querySelector<HTMLButtonElement>(
      'button[aria-label="Move item up"]',
    );

    moveUp?.focus();
    await click(moveUp ?? undefined);

    // Reordering must move the existing row and keep keyboard focus on the
    // same button, otherwise a keyboard user would drop out of the dialog.
    expect(document.activeElement).toBe(moveUp);
    expect(dialog()!.contains(document.activeElement)).toBe(true);

    await click(findButton("Save", dialog()!));

    const saved = onItemsChange.mock.calls[0]?.[0] as NavItem[];
    expect(saved.map((item) => item.label)).toEqual(["Risorse", "Home"]);
  });

  it("discards the draft on cancel and reopens from the saved state", async () => {
    const onItemsChange = vi.fn();
    mount([LINK_HOME], onItemsChange);

    await openDialog();
    await click(findButton("Add column", dialog()!));
    await click(findButton("Cancel", dialog()!));

    expect(dialog()).toBeNull();
    expect(onItemsChange).not.toHaveBeenCalled();
    expect(container?.textContent).toContain("1 item");

    await openDialog();

    expect(dialog()!.textContent).toContain("Home");
    expect(dialog()!.textContent).not.toContain("Risorse");
    expect(dialog()!.textContent).not.toContain("Column links");
  });
});
