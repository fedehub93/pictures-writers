// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { PuckContext, SlotComponent } from "@puckeditor/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BLOCK_DEFAULT_PROPS } from "../blocks/defaults";
import { editorComponentConfigs, config as pageEditorConfig } from "../config";
import { editorConfigForRegion } from "../region/editor-config";
import { mergePropsWithDefaults } from "../lib/merge-props";

/**
 * A block that owns a slot is declared `inline`, so Puck renders it without its
 * per-block wrapper `div` and hands it `puck.dragRef` instead. The block root is
 * the slot element, so the ref must land there: that element is what the editor
 * selects, drags and outlines, and it is also the box the parent lays out.
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

type InlineCase = {
  name: string;
  /** Palette to use; page blocks leave it empty. */
  region?: "HEADER";
  props: Record<string, unknown>;
  /** Classes that must be on the same element as Puck's selection ref. */
  rootClasses: string[];
};

/**
 * Classes that must be on the element Puck receives as the block root. The
 * container blocks carry the full layout surface; the Top bar keeps the
 * item-level half on the strip (its slot carries the container half).
 */
const LAYOUT_ROOT_CLASSES = ["puck-layout", "puck-dim", "puck-typo", "puck-deco"];

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
];

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function cleanup() {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
}

afterEach(cleanup);

function mount(node: React.ReactNode) {
  cleanup();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(node);
  });

  return container;
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

describe("inline block roots", () => {
  it.each(INLINE_CASES)(
    "$name attaches Puck's drag ref to its root element",
    ({ name, region, props, rootClasses }) => {
      const dragRef = vi.fn();
      const component = componentFor(name, region);

      expect(component.inline, `${name} must declare inline: true`).toBe(true);

      const resolved = mergePropsWithDefaults(defaultsFor(name), {
        id: "inline-root-test",
        ...props,
      });

      const host = mount(
        component.render({
          ...resolved,
          puck: { ...PUCK, dragRef },
        }),
      );

      const rootElement = host.firstElementChild;

      expect(rootElement, `${name} rendered nothing`).not.toBeNull();
      expect(dragRef).toHaveBeenCalled();

      const selected = dragRef.mock.calls.at(-1)?.[0] as Element | undefined;

      // The ref lands on the block root and on nothing else: there is no
      // wrapper between the host container and the block.
      expect(selected).toBe(rootElement);
      expect(host.children).toHaveLength(1);

      for (const className of rootClasses) {
        expect(
          rootElement!.classList.contains(className),
          `${name} root should carry ${className}`,
        ).toBe(true);
      }
    },
  );

  it("keeps an empty slot block selectable", () => {
    const dragRef = vi.fn();

    for (const name of ["Container", "Flex", "Grid"] as const) {
      const component = componentFor(name);

      const host = mount(
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
});

/**
 * The wrapper removal is tracked per block. A block that owns a slot was
 * migrated here; the leaves and the region blocks follow in the next ticket.
 *
 * The punch list is deliberately exhaustive rather than a minimum: a new block
 * that forgets `inline` appears in neither set and fails the accounting test, so
 * the wrapper cannot be reintroduced by omission.
 */
const WRAPPER_REMOVAL_PENDING = [
  "Brand",
  "Copyright",
  "Form",
  "Heading",
  "Icon",
  "Image",
  "Link",
  "LinkList",
  "NavbarBlock",
  "SearchBar",
  "Separator",
  "Text",
];

describe("editor block registry", () => {
  const inline = (name: string) =>
    (editorComponentConfigs[name] as { inline?: boolean } | undefined)?.inline;

  it("declares inline on the blocks that own a slot", () => {
    for (const { name } of INLINE_CASES) {
      expect(inline(name), `${name} must declare inline: true`).toBe(true);
    }
  });

  it("accounts for every registered block", () => {
    const withoutInline = Object.keys(editorComponentConfigs)
      .filter((name) => inline(name) !== true)
      .sort();

    // Nothing is missing from the registry, and nothing that should be inline
    // is still wrapped. When the punch list is empty, every block is inline.
    expect(withoutInline).toEqual(
      [...WRAPPER_REMOVAL_PENDING].sort(),
    );
  });
});
