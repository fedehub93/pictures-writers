// @vitest-environment happy-dom
import type { CustomField, PuckContext } from "@puckeditor/core";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HEADING_DEFAULT_PROPS } from "../blocks/defaults";
import {
  HEADING_DEFAULT_LEVEL,
  HEADING_LEVELS,
  HEADING_LEVEL_OPTIONS,
  type HeadingLevel,
} from "../blocks/Heading/level";
import { renderHeadingBlock } from "../blocks/Heading/render";
import type { HeadingProps } from "../blocks/Heading/types";
import { config } from "../config";

import { declarations, readPuckBaseRules } from "./helpers/css-rules";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

const levelField = config.components.Heading.fields?.level as CustomField<
  HeadingLevel | undefined
>;

/** The level editor driven through the props the panel hands it. */
function renderLevelField(
  value: HeadingLevel | undefined,
  onChange: (value: HeadingLevel | undefined) => void = () => undefined,
): string {
  return renderToStaticMarkup(
    levelField.render({
      field: levelField,
      name: "level",
      id: "level",
      value,
      onChange,
    }),
  );
}

/** The one tag in SSR markup that carries `id="level"`. */
function levelTrigger(html: string): string {
  const tag = [...html.matchAll(/<[a-z][^>]*>/g)]
    .map(([match]) => match)
    .find((candidate) => candidate.includes('id="level"'));

  if (!tag) throw new Error("No level control in the markup.");
  return tag;
}

function classesOf(tag: string): string[] {
  return (tag.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/);
}

const renderHeading = (
  props: HeadingProps = {},
  puck: PuckContext = PUCK,
): string =>
  renderToStaticMarkup(renderHeadingBlock({ id: "heading", ...props, puck }));

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("Heading block", () => {
  it.each(HEADING_LEVELS)("emits a real <%s> element", (level) => {
    const html = renderHeading({ text: "Title", level });

    expect(html.startsWith(`<${level} `)).toBe(true);
    expect(html).toContain(`</${level}>`);
  });

  it("defaults a missing level to h2", () => {
    expect(renderHeading({ text: "Title" })).toContain("<h2 ");
  });

  it("degrades an unknown level to h2 instead of arbitrary markup", () => {
    const html = renderHeading({
      text: "Title",
      level: "h7" as HeadingLevel,
    });

    expect(html).toContain("<h2 ");
    expect(html).toContain("</h2>");
    expect(html).not.toContain("h7");
  });

  it("keeps the block root classes and style variables on the heading", () => {
    const html = renderHeading({
      text: "Title",
      level: "h3",
      size: { desktop: { width: "100%" } },
      spacing: { desktop: { marginTop: "12px" } },
      typography: { desktop: { fontSize: "2rem" } },
      layout: { desktop: { display: "none" } },
    });

    expect(html).toContain(
      '<h3 class="block puck-dim puck-typo puck-block-root puck-rich-text puck-display puck-display-d"',
    );
    expect(html).toContain("--w-d:100%");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--fs-d:2rem");
  });

  it("leaves the default render otherwise unchanged", () => {
    const html = renderHeading(HEADING_DEFAULT_PROPS);

    // The render function is called directly, without Puck's rich text
    // transform, so the stored HTML reaches it as a string and is escaped.
    // Both real paths resolve the default through the shared descriptor.
    expect(html).toBe(
      `<${HEADING_DEFAULT_LEVEL} class="block puck-dim puck-typo puck-block-root puck-rich-text">&lt;p&gt;Heading&lt;/p&gt;</${HEADING_DEFAULT_LEVEL}>`,
    );
  });

  it("renders the empty container so the block keeps a root to select", () => {
    expect(renderHeading({})).toBe(
      `<${HEADING_DEFAULT_LEVEL} class="block puck-dim puck-typo puck-block-root puck-rich-text"></${HEADING_DEFAULT_LEVEL}>`,
    );
  });

  it("attaches Puck's drag ref to the heading element", () => {
    const dragRef = vi.fn();

    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    act(() => {
      root!.render(
        renderHeadingBlock({
          id: "heading",
          text: "Title",
          level: "h3",
          puck: { ...PUCK, dragRef },
        }),
      );
    });

    const heading = host.firstElementChild;

    expect(heading?.tagName).toBe("H3");
    expect(host.children).toHaveLength(1);
    expect(dragRef).toHaveBeenCalledWith(heading);
  });

  it("offers the same levels the render validates against", () => {
    expect(HEADING_LEVEL_OPTIONS.map((option) => option.value)).toEqual([
      ...HEADING_LEVELS,
    ]);
    expect(HEADING_DEFAULT_LEVEL).toBe("h2");
    expect(config.components.Heading.defaultProps?.level).toBe(
      HEADING_DEFAULT_LEVEL,
    );
  });

  it("edits the level with the panel's control box", () => {
    const html = renderLevelField("h3");
    const trigger = levelTrigger(html);
    const triggerClasses = classesOf(trigger);

    expect(html).toContain(">Level<");
    expect(trigger).toContain('data-size="sm"');
    expect(triggerClasses).toContain("px-2");
    expect(triggerClasses).toContain("text-xs!");
    expect(triggerClasses.some((name) => /^h-(\d|\()/.test(name))).toBe(false);
  });

  it("shows the level the page would emit for an unknown stored value", () => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    act(() => {
      root!.render(
        levelField.render({
          field: levelField,
          name: "level",
          id: "level",
          value: "h7" as HeadingLevel,
          onChange: () => undefined,
        }),
      );
    });

    expect(host.querySelector('[data-slot="select-value"]')?.textContent).toBe(
      HEADING_DEFAULT_LEVEL.toUpperCase(),
    );
    expect(
      host.querySelector('button[title="Reset to default"]'),
    ).not.toBeNull();
  });

  it("shows its reset only for an authored level", () => {
    expect(renderLevelField(undefined)).not.toContain("Reset to default");
    expect(renderLevelField(HEADING_DEFAULT_LEVEL)).not.toContain(
      "Reset to default",
    );
    expect(renderLevelField("h3")).toContain("Reset to default");
  });

  it("resets an authored level to the default through its props", () => {
    const onChange = vi.fn();

    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    act(() => {
      root!.render(
        levelField.render({
          field: levelField,
          name: "level",
          id: "level",
          value: "h3",
          onChange,
        }),
      );
    });

    const reset = host.querySelector('button[title="Reset to default"]');

    expect(reset).not.toBeNull();

    act(() => {
      (reset as HTMLButtonElement).click();
    });

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("puts the content first and the level before the style sections", () => {
    expect(Object.keys(config.components.Heading.fields ?? {})).toEqual([
      "text",
      "level",
      "layout",
      "size",
      "spacing",
      "typography",
    ]);
  });
});

describe("rich text container stylesheet", () => {
  const rules = readPuckBaseRules();

  const ruleFor = (selector: string) => {
    const rule = rules.find(
      (candidate) => candidate.selector === selector && !candidate.media,
    );

    if (!rule) throw new Error(`puck-base.css has no rule for ${selector}`);

    return rule;
  };

  it("spaces adjacent paragraphs in em", () => {
    expect(
      declarations(ruleFor(".puck-rich-text p + p")).get("margin-top"),
    ).toBe("1em");
  });

  it("zeroes the outer margin of the first and last child", () => {
    expect(
      declarations(ruleFor(".puck-rich-text :first-child")).get("margin-top"),
    ).toBe("0");
    expect(
      declarations(ruleFor(".puck-rich-text :last-child")).get("margin-bottom"),
    ).toBe("0");
  });
});
