import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * The properties panel is the one backoffice surface that renders its controls
 * at 32px; admin keeps the vendor's 36px. These tests drive the panel's own
 * fields through their props and read the class each control emits, because a
 * computed height is not something a DOM in this repo can produce.
 *
 * The picker only needs the tRPC hook to build its query options; the entity
 * list is part of the fixture, so a page link renders its destination control
 * without a server.
 */
vi.mock("@/trpc/client", () => {
  const items = [{ id: "root-1", rootId: "root-1", title: "Home" }];
  const queryOptions = (input: unknown) => ({
    queryKey: ["panel-control-size-test", input],
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

import { CommandSelect } from "@/shared/components/command-select";

import { SegmentedControl } from "../components/segmented-control";
import { SelectField } from "../components/select-input";
import { TextInput } from "../components/text-input";
import { ValueColorInput } from "../components/value-color-input";
import { ValueUnitInput } from "../components/value-unit-input";
import { PANEL_CONTROL } from "../components/panel-control";
import { MenuItemEditor } from "../blocks/NavbarBlock/ui/menu-item-editor";
import { LinkView } from "../fields/link/ui/view/link-view";
import { SizeView } from "../fields/size/ui/view/size-view";

const noop = () => undefined;

/** The one tag in SSR markup that carries `attribute="value"`. */
function tagWith(html: string, attribute: string, value: string) {
  const tag = [...html.matchAll(/<[a-z][^>]*>/g)]
    .map(([match]) => match)
    .find((candidate) => candidate.includes(`${attribute}="${value}"`));

  if (!tag)
    throw new Error(`No element with ${attribute}="${value}" in the markup.`);
  return tag;
}

function classesOf(tag: string) {
  // React escapes `>` in arbitrary variants such as `has-[>svg]:px-2`.
  return (tag.match(/class="([^"]*)"/)?.[1] ?? "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

/**
 * A utility class, matched whole: `h-8` must not be satisfied by `h-80`, a
 * `hover:h-8`, or the vendor's `data-[size=sm]:h-8`.
 */
function hasClass(classList: string, utility: string) {
  return classList.split(/\s+/).includes(utility);
}

/** A height utility written into the class list itself. */
function writesHeight(classList: string) {
  return classList
    .split(/\s+/)
    .some((candidate) => /^h-(\d|\()/.test(candidate));
}

/** The picker's button is the one that lays its value and its icon apart. */
function pickerButton(html: string) {
  const tag = [...html.matchAll(/<button[^>]*data-slot="button"[^>]*>/g)]
    .map(([match]) => match)
    .find((candidate) => hasClass(classesOf(candidate), "justify-between"));

  if (!tag) throw new Error("No command picker button in the markup.");
  return tag;
}

function render(element: ReactElement) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {element}
    </QueryClientProvider>,
  );
}

describe("the properties panel's control box", () => {
  it("gives a text field and a select in one section the same box", () => {
    const html = render(
      <>
        <TextInput name="label" value="About" onChange={noop} />
        <SelectField<{ type: string }>
          name="type"
          label="Link type"
          options={["page", "external"]}
          currentValues={{}}
          renderValues={{ type: "page" }}
          resetProp={noop}
          update={noop}
        />
      </>,
    );

    const field = classesOf(tagWith(html, "id", "label"));
    expect(hasClass(field, "h-8")).toBe(true);
    expect(hasClass(field, "px-2")).toBe(true);
    expect(hasClass(field, "text-xs!")).toBe(true);

    const select = tagWith(html, "id", "type");
    const selectClasses = classesOf(select);
    expect(hasClass(selectClasses, "px-2")).toBe(true);
    expect(hasClass(selectClasses, "px-3")).toBe(false);
    expect(hasClass(selectClasses, "text-xs!")).toBe(true);
    // The height is the vendor's `sm` size variant, not a class of the panel's
    // — a variant outranks a plain utility, which is how the two disagreed.
    expect(select).toContain('data-size="sm"');
    expect(writesHeight(selectClasses)).toBe(false);
  });

  it("gives the unit input the same box", () => {
    const html = render(
      <ValueUnitInput name="width" value="10" onChange={noop} />,
    );

    const group = classesOf(tagWith(html, "data-slot", "input-group"));
    expect(hasClass(group, "h-8")).toBe(true);
    expect(hasClass(group, "h-9")).toBe(false);

    const input = classesOf(tagWith(html, "id", "width"));
    expect(hasClass(input, "px-2")).toBe(true);
    expect(hasClass(input, "px-3")).toBe(false);
    expect(hasClass(input, "text-xs!")).toBe(true);
  });

  it("keeps the panel's other controls on the same box", () => {
    const html = render(
      <div>
        <ValueColorInput name="backgroundColor" value="#fff" onChange={noop} />
        <SegmentedControl<"left" | "center">
          name="align"
          value="left"
          onChange={noop}
          items={[
            { value: "left", title: "Left" },
            { value: "center", title: "Center" },
          ]}
        />
      </div>,
    );

    const color = classesOf(tagWith(html, "name", "backgroundColor"));
    expect(hasClass(color, "h-8")).toBe(true);
    expect(hasClass(color, "px-2")).toBe(true);
    expect(hasClass(color, "text-xs!")).toBe(true);

    const segmented = classesOf(tagWith(html, "id", "align"));
    expect(hasClass(segmented, "h-8")).toBe(true);
    expect(hasClass(segmented, "h-9")).toBe(false);
  });

  it("gives the size field's select and custom input the same box", () => {
    const html = render(
      <SizeView
        currentValues={{ aspectRatio: "2 / 1" }}
        renderValues={{ aspectRatio: "2 / 1" }}
        resetProp={noop}
        onUpdate={noop}
      />,
    );

    const aspectRatio = tagWith(html, "data-slot", "select-trigger");
    expect(aspectRatio).toContain('data-size="sm"');
    expect(writesHeight(classesOf(aspectRatio))).toBe(false);
    expect(hasClass(classesOf(aspectRatio), "px-2")).toBe(true);

    const customRatio = tagWith(html, "placeholder", "es. 3 / 2");

    expect(hasClass(classesOf(customRatio), "h-8")).toBe(true);
    expect(hasClass(classesOf(customRatio), "px-2")).toBe(true);
    expect(hasClass(classesOf(customRatio), "text-xs!")).toBe(true);
  });

  it("gives the link field's picker and select the panel's box", () => {
    const html = render(
      <LinkView
        state={{ type: "page", pageId: "root-1", label: "About" }}
        onUpdate={noop}
      />,
    );

    const picker = classesOf(pickerButton(html));
    expect(hasClass(picker, "h-8")).toBe(true);
    expect(hasClass(picker, "h-9")).toBe(false);
    expect(hasClass(picker, "text-xs!")).toBe(true);
    // The Button pads itself on a variant for its icon, so the panel states
    // the same padding on the same variant instead of a class that loses.
    expect(hasClass(picker, "has-[>svg]:px-2")).toBe(true);
    expect(hasClass(picker, "has-[>svg]:px-3")).toBe(false);

    const select = tagWith(html, "id", "type");
    expect(select).toContain('data-size="sm"');
    expect(writesHeight(classesOf(select))).toBe(false);
    expect(hasClass(classesOf(select), "px-2")).toBe(true);
  });

  it("leaves an admin picker at the vendor's height", () => {
    const html = render(
      <CommandSelect
        options={[]}
        onSelect={noop}
        value=""
        placeholder="Select a form"
      />,
    );

    const picker = classesOf(pickerButton(html));
    expect(hasClass(picker, "h-9")).toBe(true);
    expect(hasClass(picker, "h-8")).toBe(false);
  });
});

/**
 * The panel draws its controls on its own surface and inside `bg-muted/60`
 * groups, so a transparent control changes shade as it moves between sections.
 * The fill is shared and does not come from the surface, which is the invariant
 * these tests fix: the same background on every control, and no
 * `bg-transparent` left for `twMerge` to have removed.
 */
function expectPanelFill(classList: string) {
  expect(hasClass(classList, "bg-background")).toBe(true);
  expect(hasClass(classList, "dark:bg-input/30")).toBe(true);
  expect(hasClass(classList, "bg-transparent")).toBe(false);
}

describe("the properties panel's control fill", () => {
  it("gives the text field, the select and the colour field one fill", () => {
    const html = render(
      <>
        <TextInput name="label" value="About" onChange={noop} />
        <SelectField<{ type: string }>
          name="type"
          label="Link type"
          options={["page", "external"]}
          currentValues={{}}
          renderValues={{ type: "page" }}
          resetProp={noop}
          update={noop}
        />
        <ValueColorInput name="backgroundColor" value="#fff" onChange={noop} />
      </>,
    );

    expectPanelFill(classesOf(tagWith(html, "id", "label")));
    expectPanelFill(classesOf(tagWith(html, "id", "type")));
    expectPanelFill(classesOf(tagWith(html, "name", "backgroundColor")));
  });

  it("gives the unit input the fill on its box, not on its inner input", () => {
    const html = render(
      <ValueUnitInput name="width" value="10" onChange={noop} />,
    );

    expectPanelFill(classesOf(tagWith(html, "data-slot", "input-group")));

    // The inner input takes the panel's box too; painting it would stack a
    // second translucent layer over the group in dark mode.
    const inner = classesOf(tagWith(html, "id", "width"));
    expect(hasClass(inner, "bg-background")).toBe(false);
  });

  it("gives the segmented control and the picker the same fill", () => {
    const html = render(
      <>
        <SegmentedControl<"left" | "center">
          name="align"
          value="left"
          onChange={noop}
          items={[
            { value: "left", title: "Left" },
            { value: "center", title: "Center" },
          ]}
        />
        <LinkView
          state={{ type: "page", pageId: "root-1", label: "About" }}
          onUpdate={noop}
        />
      </>,
    );

    expectPanelFill(classesOf(tagWith(html, "id", "align")));
    expectPanelFill(classesOf(pickerButton(html)));
  });

  it("gives the size field's custom ratio input the same fill", () => {
    const html = render(
      <SizeView
        currentValues={{ aspectRatio: "2 / 1" }}
        renderValues={{ aspectRatio: "2 / 1" }}
        resetProp={noop}
        onUpdate={noop}
      />,
    );

    expectPanelFill(classesOf(tagWith(html, "placeholder", "es. 3 / 2")));
  });

  it("gives the block fields' textareas the same fill", () => {
    const html = render(
      <MenuItemEditor
        item={{
          type: "card",
          label: "Card",
          link: { type: "external", url: "" },
        }}
        onChange={noop}
      />,
    );

    // The two description textareas of the menu editor render here; the
    // Copyright field's textarea takes the same token, pinned below.
    const textareas = [...html.matchAll(/<textarea[^>]*>/g)].map(
      ([tag]) => tag,
    );
    expect(textareas.length).toBeGreaterThan(0);
    for (const textarea of textareas) expectPanelFill(classesOf(textarea));

    expectPanelFill(PANEL_CONTROL.textArea);
  });
});
