import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { BREAKPOINTS } from "../utils/breakpoints";

/**
 * Tripwire for Puck's root zone.
 *
 * While editing, Puck renders the document root content into a droppable whose
 * id is `root` + `default-zone`. That element has no counterpart on the
 * published page, so `puck-base.css` gives it the container half of the layout
 * contract; without it the canvas lays the top level out as block flow while
 * the page uses the root's flex/grid. The id is read from the installed package
 * instead of being restated here, so a Puck upgrade that renames the zone fails
 * loudly instead of silently disabling the rule.
 */
const stylesheet = readFileSync(
  new URL("../styles/puck-base.css", import.meta.url),
  "utf8",
);

const LAYOUT_SELECTOR = ".puck-layout";

const ROOT_ZONE_SELECTOR = `[data-puck-dropzone="${puckRootDroppableId()}"]`;

/**
 * The container-level properties the zone must mirror. `align-self` is
 * deliberately absent: it describes the root as a child of its own parent, not
 * its content.
 */
const CONTAINER_PROPERTIES = [
  ["display", "disp"],
  ["flex-direction", "fd"],
  ["flex-wrap", "fwrap"],
  ["justify-content", "jc"],
  ["align-items", "ai"],
  ["align-content", "ac"],
  ["justify-items", "ji"],
  ["row-gap", "rgap"],
  ["column-gap", "cgap"],
  ["grid-template-columns", "gtc"],
  ["grid-template-rows", "gtr"],
] as const;

type Rule = { selector: string; body: string; media: string | null };

function puckRootDroppableId() {
  const require = createRequire(import.meta.url);
  const bundle = readFileSync(require.resolve("@puckeditor/core"), "utf8");
  const area = /rootAreaId = "([^"]+)"/.exec(bundle)?.[1];
  const zone = /rootZone = "([^"]+)"/.exec(bundle)?.[1];

  if (!area || !zone) {
    throw new Error(
      "Cannot derive Puck's root droppable id from @puckeditor/core/dist. " +
        "Find the element the editor marks with `data-puck-dropzone` for the " +
        "root zone and update the selector in puck-base.css.",
    );
  }

  return `${area}:${zone}`;
}

function findClosingBrace(source: string, openIndex: number) {
  let depth = 0;

  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}" && --depth === 0) return index;
  }

  throw new Error(`Unbalanced braces in puck-base.css at index ${openIndex}`);
}

/** Flattens the stylesheet into rules, remembering the media query each sits in. */
function parseRules(source: string, media: string | null = null): Rule[] {
  const rules: Rule[] = [];
  let prelude = "";
  let index = 0;

  while (index < source.length) {
    if (source[index] !== "{") {
      prelude += source[index];
      index += 1;
      continue;
    }

    const close = findClosingBrace(source, index);
    const body = source.slice(index + 1, close);
    const selector = prelude.trim();

    if (selector.startsWith("@media")) {
      rules.push(...parseRules(body, selector));
    } else if (selector) {
      rules.push({ selector, body, media });
    }

    prelude = "";
    index = close + 1;
  }

  return rules;
}

function declarations(rule: Rule) {
  return new Map(
    rule.body
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf(":");
        return [
          entry.slice(0, separator).trim(),
          entry.slice(separator + 1).trim(),
        ] as const;
      }),
  );
}

/** Drops the local variable resets, which only the layout element declares. */
function authoredDeclarations(rule: Rule) {
  return new Map(
    [...declarations(rule)].filter(
      ([property]) => !property.startsWith("--"),
    ),
  );
}

const rules = parseRules(stylesheet.replace(/\/\*[\s\S]*?\*\//g, ""));

const layoutRules = rules.filter((rule) => rule.selector === LAYOUT_SELECTOR);

const zoneRules = rules.filter((rule) => rule.selector === ROOT_ZONE_SELECTOR);

describe("root zone layout", () => {
  it("targets the root droppable id of the installed Puck version", () => {
    expect(
      zoneRules.length,
      `puck-base.css has no rule for ${ROOT_ZONE_SELECTOR}: did Puck rename its root zone?`,
    ).toBeGreaterThan(0);
  });

  it("declares the zone once per layout breakpoint, in the layout's queries", () => {
    expect(layoutRules.map((rule) => rule.media)).toEqual([
      null,
      `@media (max-width: ${BREAKPOINTS.tablet.maxWidth}px)`,
      `@media (max-width: ${BREAKPOINTS.mobile.maxWidth}px)`,
    ]);
    expect(zoneRules.map((rule) => rule.media)).toEqual(
      layoutRules.map((rule) => rule.media),
    );
  });

  it("mirrors the container half of `.puck-layout` and never `align-self`", () => {
    expect(zoneRules).toHaveLength(layoutRules.length);

    layoutRules.forEach((layoutRule, index) => {
      const expected = authoredDeclarations(layoutRule);
      expected.delete("align-self");

      expect(declarations(zoneRules[index])).toEqual(expected);
    });
  });

  it("reads the desktop contract from the root's inherited variables", () => {
    const desktop = declarations(zoneRules[0]);

    for (const [property, variable] of CONTAINER_PROPERTIES) {
      expect(desktop.get(property), property).toBe(`var(--${variable}-d)`);
    }
  });
});
