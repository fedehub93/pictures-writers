// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PuckContext, SlotComponent } from "@puckeditor/core";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * NavbarBlock reads the pathname and the Form block's runner needs the router;
 * both are unrelated to where the selection ref lands, so they are stubbed.
 */
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: () => undefined }),
}));

import { BLOCK_DEFAULT_PROPS } from "../blocks/defaults";
import { editorComponentConfigs, config as pageEditorConfig } from "../config";
import { editorConfigForRegion } from "../region/editor-config";
import { mergePropsWithDefaults } from "../lib/merge-props";

import { installPuckBaseStyles } from "./helpers/puck-base-css";

/**
 * Every block is declared `inline`, so Puck renders it without its per-block
 * wrapper `div` and hands it `puck.dragRef` instead. The block root is the
 * element that carries its own classes, and the ref must land exactly there:
 * that element is what the editor selects, drags and outlines, and it is also
 * the box the parent lays out.
 *
 * These tests mount the render output in a real DOM because a ref is only
 * invoked by a client render; the server-markup parity test cannot observe it.
 */

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: true,
  dragRef: null,
};

/**
 * Stand-in for Puck's slot. The real `Slot` forwards a `ref` to the element it
 * renders (React 19 passes it as a normal prop), so the stub does the same:
 * without it there is nothing to observe when the block forwards the ref.
 */
type StubSlotProps = {
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLDivElement>;
};

const SlotStub: SlotComponent = (props?: StubSlotProps) => {
  const stubProps: StubSlotProps = props ?? {};
  const { ref, className, style } = stubProps;

  return (
    <div ref={ref} data-slot="stub" className={className} style={style} />
  );
};

/**
 * A root-only form. The block renders its real root (`puck-dim` plus the
 * layout classes) instead of the "Select a valid form!" placeholder, without
 * pulling a content tree into this test.
 */
const EMPTY_FORM = {
  id: "inline-form",
  gtmEventName: null,
  content: {
    id: "root",
    isContainer: true,
    type: "Root",
    properties: {
      submission: {
        onSuccess: { type: "toast", successMessage: "Grazie!" },
      },
    },
    children: [],
  },
} as const;

/** Container blocks carry the whole layout surface on their root. */
const LAYOUT_ROOT_CLASSES = ["puck-layout", "puck-dim", "puck-typo", "puck-deco"];

type InlineCase = {
  name: string;
  /** Palette to use; page blocks leave it empty. */
  region?: "HEADER" | "FOOTER";
  props: Record<string, unknown>;
  /** Metadata the editor injects into the canvas (Installation settings). */
  metadata?: PuckContext["metadata"];
  /** Classes that must be on the same element as Puck's selection ref. */
  rootClasses: string[];
};

const INLINE_CASES: InlineCase[] = [
  {
    name: "Container",
    props: { items: SlotStub },
    rootClasses: LAYOUT_ROOT_CLASSES,
  },
  {
    name: "Flex",
    props: { items: SlotStub },
    rootClasses: LAYOUT_ROOT_CLASSES,
  },
  {
    name: "Grid",
    props: { items: SlotStub },
    rootClasses: LAYOUT_ROOT_CLASSES,
  },
  {
    name: "TopBar",
    region: "HEADER",
    props: { content: SlotStub, settings: { dismissible: false } },
    rootClasses: ["puck-layout-item", "puck-dim", "puck-deco", "puck-top-bar"],
  },
  {
    name: "Text",
    props: { text: "Hello" },
    rootClasses: ["puck-dim", "puck-typo"],
  },
  {
    name: "Heading",
    props: { text: "Hello" },
    rootClasses: ["puck-dim", "puck-typo"],
  },
  {
    name: "Button",
    props: {
      button: {
        link: {
          type: "external",
          url: "https://example.com/",
          label: "Example",
        },
      },
    },
    rootClasses: ["puck-dim", "puck-typo", "puck-deco", "puck-button"],
  },
  {
    name: "Image",
    props: { image: { src: "/cover.png", alt: "Cover" } },
    rootClasses: ["puck-dim"],
  },
  {
    name: "Icon",
    props: { icon: { name: "star" } },
    rootClasses: ["puck-dim", "puck-typo"],
  },
  {
    name: "Form",
    props: { form: EMPTY_FORM },
    rootClasses: ["puck-dim"],
  },
  {
    name: "Separator",
    props: { size: { desktop: { width: "100%", height: "2px" } } },
    rootClasses: ["puck-dim"],
  },
  {
    // Without Installation metadata the brand has nothing to draw.
    name: "Brand",
    region: "HEADER",
    props: { content: { showSiteName: true, showLogo: false } },
    metadata: { siteName: "Acme" },
    rootClasses: ["puck-dim", "puck-typo"],
  },
  {
    name: "LinkList",
    region: "FOOTER",
    props: {
      content: {
        title: "Resources",
        links: [{ link: { type: "external", url: "/blog/", label: "Blog" } }],
      },
    },
    rootClasses: ["puck-dim", "puck-typo"],
  },
  {
    name: "Copyright",
    region: "FOOTER",
    props: { content: { showYear: true, extraText: "", links: [] } },
    metadata: { siteName: "Acme" },
    rootClasses: ["puck-dim", "puck-typo"],
  },
  {
    name: "SearchBar",
    region: "HEADER",
    props: { content: { placeholder: "Search", variant: "inline" } },
    rootClasses: ["puck-dim", "puck-deco"],
  },
  {
    name: "NavbarBlock",
    region: "HEADER",
    props: {},
    rootClasses: ["puck-dim", "puck-deco", "puck-nav"],
  },
];

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
let queryClient: QueryClient | null = null;

/**
 * The block root is also a containing block, and that rule lives in
 * `puck-base.css`. Installing the real stylesheet lets these tests assert the
 * computed position on every root, including Icon, whose lazy glyph has no
 * static markup for the render-pipeline test to inspect.
 */
let removeStyles: (() => void) | null = null;

beforeAll(() => {
  removeStyles = installPuckBaseStyles();
});

afterAll(() => {
  removeStyles?.();
});

function cleanup() {
  act(() => {
    root?.unmount();
  });
  queryClient?.clear();
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
  queryClient = null;
}

afterEach(cleanup);

async function mount(node: React.ReactNode) {
  cleanup();

  queryClient = new QueryClient();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root!.render(
      <QueryClientProvider client={queryClient!}>{node}</QueryClientProvider>,
    );
  });

  return container;
}

/**
 * Wait until the editor's ref callback has been invoked.
 *
 * Most blocks attach the ref on mount, so this returns immediately. The Icon
 * block is the exception: it renders a `DynamicIcon`, which keeps no DOM until
 * its glyph chunk resolves, so the callback only fires once the `<svg>` exists.
 * Waiting keeps this table honest against the real component instead of a stub.
 */
async function waitForDragRef(dragRef: ReturnType<typeof vi.fn>) {
  for (let attempt = 0; attempt < 100 && !dragRef.mock.calls.length; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
}

function componentsFor(region?: InlineCase["region"]) {
  return region
    ? editorConfigForRegion(region).components
    : pageEditorConfig.components;
}

type TestableComponent = {
  inline?: boolean;
  render: (props: Record<string, unknown>) => React.ReactNode;
};

function componentFor(name: string, region?: InlineCase["region"]) {
  return (
    componentsFor(region) as unknown as Record<string, TestableComponent>
  )[name];
}

function defaultsFor(name: string) {
  return (BLOCK_DEFAULT_PROPS as Record<string, object>)[name];
}

/**
 * Render a block the way the canvas does: through its editor config, with the
 * default props already merged in and a spy drag ref.
 */
async function renderCase({
  name,
  region,
  props,
  metadata,
}: InlineCase) {
  const dragRef = vi.fn();
  const component = componentFor(name, region);

  expect(component.inline, `${name} must declare inline: true`).toBe(true);

  const resolved = mergePropsWithDefaults(defaultsFor(name), {
    id: `inline-root-${name}`,
    ...props,
  });

  const host = await mount(
    component.render({
      ...resolved,
      puck: { ...PUCK, metadata: metadata ?? {}, dragRef },
    }),
  );

  await waitForDragRef(dragRef);

  return { host, dragRef };
}

describe("inline block roots", () => {
  it.each(INLINE_CASES)(
    "$name attaches Puck's drag ref to its root element",
    async (testCase) => {
      const { host, dragRef } = await renderCase(testCase);
      const rootElement = host.firstElementChild;

      expect(rootElement, `${testCase.name} rendered nothing`).not.toBeNull();
      expect(dragRef).toHaveBeenCalled();

      const selected = dragRef.mock.calls.at(-1)?.[0] as Element | undefined;

      // The ref lands on the block root and on nothing else: there is no
      // wrapper between the host container and the block.
      expect(selected).toBe(rootElement);
      expect(host.children).toHaveLength(1);

      // `puck-dim` is the class that activates the authored size and spacing, so it
      // must live on the same element the editor selects.
      expect(
        rootElement!.classList.contains("puck-dim"),
        `${testCase.name} root should carry puck-dim`,
      ).toBe(true);

      for (const className of testCase.rootClasses) {
        expect(
          rootElement!.classList.contains(className),
          `${testCase.name} root should carry ${className}`,
        ).toBe(true);
      }

      // The root is the containing block for absolutely positioned
      // descendants in both paths, so the class has to be here and the
      // stylesheet has to make it relative.
      expect(
        rootElement!.classList.contains("puck-block-root"),
        `${testCase.name} root should carry puck-block-root`,
      ).toBe(true);
      expect(
        window.getComputedStyle(rootElement!).position,
        `${testCase.name} root should be the containing block`,
      ).toBe("relative");
    },
  );

  it("covers every registered block", () => {
    // A block added to the registry without a case here would leave its ref
    // plumbing untested, which is exactly how the wrapper came back before.
    expect(INLINE_CASES.map((entry) => entry.name).sort()).toEqual(
      Object.keys(editorComponentConfigs).sort(),
    );
  });

  it("keeps an empty slot block selectable", async () => {
    const dragRef = vi.fn();

    for (const name of ["Container", "Flex", "Grid"] as const) {
      const component = componentFor(name);

      const host = await mount(
        component.render({
          ...mergePropsWithDefaults(defaultsFor(name), {
            id: `empty-${name}`,
            items: SlotStub,
          }),
          puck: { ...PUCK, dragRef },
        }),
      );

      const rootElement = host.firstElementChild as HTMLElement;

      // No wrapper and no `display: none`: the empty block still has the box
      // Puck needs for its drop target and for the selection overlay.
      expect(host.children).toHaveLength(1);
      expect(rootElement.dataset.slot).toBe("stub");
      expect(dragRef.mock.calls.at(-1)?.[0]).toBe(rootElement);
    }
  });

  it("keeps the Button fallback root ref'ed when the target is unresolved", async () => {
    const { host, dragRef } = await renderCase({
      name: "Button",
      // No href: the block renders plain text instead of an anchor.
      props: { button: { link: { label: "Removed page" } } },
      rootClasses: ["puck-dim"],
    });

    const rootElement = host.firstElementChild as HTMLElement;

    expect(rootElement.tagName).toBe("SPAN");
    expect(dragRef.mock.calls.at(-1)?.[0]).toBe(rootElement);
  });

  it("keeps the Image anchor as the root when the image links somewhere", async () => {
    const { host, dragRef } = await renderCase({
      name: "Image",
      props: { image: { src: "/cover.png", alt: "Cover", href: "/blog/" } },
      rootClasses: ["puck-dim"],
    });

    const rootElement = host.firstElementChild as HTMLElement;

    expect(rootElement.tagName).toBe("A");
    expect(rootElement.querySelector("img")).not.toBeNull();
    expect(dragRef.mock.calls.at(-1)?.[0]).toBe(rootElement);
  });

  it("keeps a Form without a selection selectable", async () => {
    const { host, dragRef } = await renderCase({
      name: "Form",
      // The placeholder fills its area instead of taking `puck-dim`, so only
      // the ref is asserted here; see `FormBlockUi`.
      props: { form: { id: "", content: null, gtmEventName: null } },
      rootClasses: [],
    });

    const rootElement = host.firstElementChild as HTMLElement;

    expect(rootElement.textContent).toBe("Select a valid form!");
    expect(rootElement.classList.contains("puck-block-root")).toBe(true);
    expect(window.getComputedStyle(rootElement).position).toBe("relative");
    expect(dragRef.mock.calls.at(-1)?.[0]).toBe(rootElement);
  });
});

/**
 * The registry is the single source of truth for the palettes, so the
 * invariant has to hold for every entry, with no allow-list: a block that
 * forgets `inline` would quietly reintroduce the wrapper in the canvas.
 */
describe("editor block registry", () => {
  it("declares inline on every registered block", () => {
    const withoutInline = Object.keys(editorComponentConfigs).filter(
      (name) =>
        (editorComponentConfigs[name] as { inline?: boolean } | undefined)
          ?.inline !== true,
    );

    expect(withoutInline).toEqual([]);
  });
});
