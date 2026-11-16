// @vitest-environment happy-dom
import type { CustomField } from "@puckeditor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The link editor only needs the tRPC hook to build its entity-picker query
 * options. The entity list is part of the fixture, so the editor can select a
 * destination without a server.
 */
vi.mock("@/trpc/client", () => {
  const items = [
    { id: "root-1", rootId: "root-1", title: "Home" },
    { id: "root-2", rootId: "root-2", title: "About" },
  ];
  const queryOptions = (input: unknown) => ({
    queryKey: ["button-content-field-test", input],
    queryFn: () => new Promise<never>(() => undefined),
    initialData: { items, total: items.length },
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
 * The icon picker is a popover of its own; this panel only has to prove the
 * shared Icon control is offered with the stored value.
 */
vi.mock("@/puck/fields/icon/ui/view/icon-view", () => ({
  IconView: ({ state }: { state?: { name?: string } }) => (
    <span data-testid="icon-view">{state?.name ?? "none"}</span>
  ),
}));

import { ButtonContentField } from "../blocks/Button/field";
import type {
  ButtonContentProps,
  ButtonVariant,
} from "../blocks/Button/types";

const field = ButtonContentField as CustomField<
  ButtonContentProps | undefined
>;

const VARIANT_TITLES: Record<ButtonVariant, string> = {
  primary: "Primary",
  secondary: "Secondary",
  outline: "Outline",
  ghost: "Ghost",
};

function renderStatic(value?: ButtonContentProps) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {field.render({
        field,
        name: "button",
        id: "button",
        value,
        onChange: () => undefined,
      })}
    </QueryClientProvider>,
  );
}

describe("Button content section", () => {
  it("renders one section in the order the button reads", () => {
    const html = renderStatic({
      link: { type: "external", url: "https://example.com/", label: "Start" },
      icon: { name: "play" },
    });

    const controls = [
      'id="variant"',
      'id="text"',
      'id="button-link-type"',
      ">Icon<",
      'id="iconPosition"',
      'id="iconSpacing"',
    ].map((marker) => html.indexOf(marker));

    expect(controls.every((index) => index >= 0)).toBe(true);
    expect([...controls].sort((a, b) => a - b)).toEqual(controls);
    expect(html).toContain("Icon position");
    expect(html).toContain("Icon spacing");
  });

  it("offers no empty variant and no size option", () => {
    const html = renderStatic();

    for (const title of Object.values(VARIANT_TITLES)) {
      expect(html).toContain(`>${title}<`);
    }

    expect(html).not.toContain(">Default<");
    expect(html).not.toContain(">None<");
    expect(html).not.toContain(">Size<");
  });

  it("does not render the link editor's own label control", () => {
    const html = renderStatic({
      link: { type: "external", url: "https://example.com/", label: "Start" },
    });

    expect(html).toContain("Link type");
    expect(html).not.toContain('id="button-link-label"');
    expect(html).toContain('value="Start"');
  });

  it("offers the icon controls even when no icon is chosen", () => {
    const html = renderStatic();

    expect(html).toContain('data-testid="icon-view">none');
    expect(html).toContain("Icon position");
    expect(html).toContain("Icon spacing");
  });

  it("states in one line where the unset style values come from", () => {
    const html = renderStatic();

    // The Variant and the base box are class-owned, so the Decoration,
    // Typography and Spacing fields — each reading only its own prop — cannot
    // show them as placeholders. One line covers all three (ADR-0045).
    expect(html).toContain("set the starting style");
    expect(html).toContain(
      "a Decoration, Typography or Spacing value overrides it",
    );
  });
});

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function Harness({
  initial,
  onValueChange,
}: {
  initial: ButtonContentProps;
  onValueChange?: (value: ButtonContentProps) => void;
}) {
  const [value, setValue] = useState<ButtonContentProps>(initial);

  return field.render({
    field,
    name: "button",
    id: "button",
    value,
    onChange: (next) => {
      setValue(next ?? {});
      onValueChange?.(next ?? {});
    },
  });
}

function mount(initial: ButtonContentProps, onValueChange?: (v: ButtonContentProps) => void) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <QueryClientProvider client={new QueryClient()}>
        <Harness initial={initial} onValueChange={onValueChange} />
      </QueryClientProvider>,
    );
  });

  return container;
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

function click(element: Element | undefined) {
  expect(element).toBeDefined();

  act(() => {
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

function commandRow(label: string) {
  return Array.from(document.querySelectorAll("[cmdk-item]")).find((item) =>
    item.textContent?.includes(label),
  );
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
});

describe("Button variant control", () => {
  it("always shows a variant and stores a pick without discarding authored props", () => {
    const onValueChange = vi.fn();
    mount(
      {
        link: { type: "external", url: "https://example.com/", label: "Start" },
        icon: { name: "play" },
        iconPosition: "after",
      },
      onValueChange,
    );

    const group = container!.querySelector("#variant");
    expect(group).not.toBeNull();
    expect(group!.querySelector('[data-state="on"]')?.textContent).toBe(
      VARIANT_TITLES.primary,
    );

    click(findButton(VARIANT_TITLES.secondary, group!));

    const stored = onValueChange.mock.calls.at(-1)?.[0] as ButtonContentProps;
    expect(stored).toMatchObject({
      variant: "secondary",
      link: {
        type: "external",
        url: "https://example.com/",
        label: "Start",
      },
      icon: { name: "play" },
      iconPosition: "after",
    });
  });
});

describe("Button text and target", () => {
  it("keeps the text the author typed when the target changes", () => {
    const onValueChange = vi.fn();
    mount(
      {
        link: { type: "page", pageId: "root-1", label: "Home" },
      },
      onValueChange,
    );

    type(container!.querySelector<HTMLInputElement>("#text")!, "Start Playing");

    click(findButton("Home"));
    expect(dialog()).not.toBeNull();

    click(commandRow("About"));

    const stored = onValueChange.mock.calls.at(-1)?.[0] as ButtonContentProps;
    expect(stored.link).toMatchObject({
      type: "page",
      pageId: "root-2",
      label: "Start Playing",
    });
  });

  it("fills a fresh button's text from the target title", () => {
    const onValueChange = vi.fn();
    mount(
      {
        // The block's default label is a placeholder, not text the author
        // typed, so the first target still names the button.
        link: {
          type: "page",
          pageId: "root-1",
          label: "Inserisci il tuo link",
        },
      },
      onValueChange,
    );

    click(findButton("Home"));
    expect(dialog()).not.toBeNull();

    click(commandRow("About"));

    const stored = onValueChange.mock.calls.at(-1)?.[0] as ButtonContentProps;
    expect(stored.link).toMatchObject({ pageId: "root-2", label: "About" });
  });

  it("fills the text from the target title when it was not typed", () => {
    const onValueChange = vi.fn();
    mount(
      {
        link: { type: "page", pageId: "root-1", label: "Home" },
      },
      onValueChange,
    );

    click(findButton("Home"));
    expect(dialog()).not.toBeNull();

    click(commandRow("About"));

    const stored = onValueChange.mock.calls.at(-1)?.[0] as ButtonContentProps;
    expect(stored.link).toMatchObject({
      type: "page",
      pageId: "root-2",
      label: "About",
    });
  });

  it("writes the text into the link label, not a separate prop", () => {
    const onValueChange = vi.fn();
    mount(
      {
        link: { type: "external", url: "https://example.com/" },
      },
      onValueChange,
    );

    type(container!.querySelector<HTMLInputElement>("#text")!, "Play now");

    const stored = onValueChange.mock.calls.at(-1)?.[0] as ButtonContentProps;
    expect(stored).toEqual({
      link: { type: "external", url: "https://example.com/", label: "Play now" },
    });
  });
});
