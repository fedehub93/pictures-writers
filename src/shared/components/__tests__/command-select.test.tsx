import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CommandSelect } from "../command-select";

const noop = () => undefined;

const LONG_TITLE = "How to photograph mountains in late winter light";

/** A utility class, matched whole: `min-w-0` must not be satisfied by a variant. */
function hasClass(classList: string, utility: string) {
  return classList.split(/\s+/).includes(utility);
}

function classesOf(tag: string) {
  return tag.match(/class="([^"]*)"/)?.[1] ?? "";
}

/** The picker's button, and the markup it holds between its tags. */
function pickerButton(html: string) {
  const opening = [...html.matchAll(/<button[^>]*data-slot="button"[^>]*>/g)].find(
    ([tag]) => hasClass(classesOf(tag), "justify-between"),
  );
  if (!opening) throw new Error("No command picker button in the markup.");

  const start = opening.index ?? 0;
  const close = html.indexOf("</button>", start);
  if (close === -1) throw new Error("The command picker button never closes.");

  return { content: html.slice(start + opening[0].length, close) };
}

/** The div that holds the picker's value or its placeholder. */
function valueWrapper(content: string) {
  const match = /<div class="([^"]*)">([\s\S]*?)<\/div>/.exec(content);
  if (!match) throw new Error("No wrapper around the picker's value.");

  return { classes: match[1], text: match[2] };
}

/**
 * The wrapper that keeps a value inside the control: it may not keep a minimum
 * width of its own, and it ends in an ellipsis.
 */
function expectTruncating(content: string) {
  const wrapper = valueWrapper(content);

  expect(hasClass(wrapper.classes, "min-w-0")).toBe(true);
  expect(hasClass(wrapper.classes, "truncate")).toBe(true);

  return wrapper;
}

function picker({
  children,
  value,
  placeholder,
  className,
}: {
  children: ReactNode;
  value: string;
  placeholder?: string;
  className?: string;
}) {
  return renderToStaticMarkup(
    <CommandSelect
      options={[{ id: "1", value: "1", children }]}
      onSelect={noop}
      value={value}
      placeholder={placeholder}
      className={className}
    />,
  );
}

describe("the command picker's value", () => {
  it("gives the panel's picker a shrinking, truncating wrapper", () => {
    const html = picker({
      children: <span>{LONG_TITLE}</span>,
      value: "1",
      placeholder: "Select content",
      // The compact box the properties panel's picker takes.
      className: "h-8 px-2 text-xs! has-[>svg]:px-2 w-full",
    });

    const { content } = pickerButton(html);
    const wrapper = expectTruncating(content);
    expect(wrapper.text).toContain(LONG_TITLE);
  });

  it("keeps the icon out of the shrinking value", () => {
    const html = picker({
      children: <span>{LONG_TITLE}</span>,
      value: "1",
      placeholder: "Select content",
    });

    const { content } = pickerButton(html);
    const icon = content.match(/<svg[^>]*>/)?.[0];
    if (!icon) throw new Error("No icon in the command picker.");

    expect(hasClass(classesOf(icon), "shrink-0")).toBe(true);
  });

  it("holds the placeholder to the same rule", () => {
    const html = picker({
      children: null,
      value: "",
      placeholder: "Select a destination longer than this box",
    });

    const { content } = pickerButton(html);
    const wrapper = expectTruncating(content);
    expect(wrapper.text).toContain("Select a destination longer than this box");
  });

  it("truncates an admin picker's value, not only the panel's", () => {
    // The admin filter's own box, such as the reviews product filter states it.
    const html = picker({
      children: <span>{LONG_TITLE}</span>,
      value: "1",
      placeholder: "Product",
      className: "h-8 max-w-60",
    });

    const { content } = pickerButton(html);
    expectTruncating(content);
  });
});
