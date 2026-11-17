/**
 * Minimal reader for `puck-base.css`.
 *
 * Several tests assert the *rules* of the shared stylesheet (the root zone
 * selector, the hidden-block ghost), not the rendered pixels, which no DOM in
 * this repo can produce. This flattens the file into rules with the media
 * query each one sits in, so a test can pick a subset by selector and assert
 * its declarations and its query.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type Rule = {
  selector: string;
  body: string;
  media: string | null;
};

/** The shared stylesheet as rules, with comments removed. */
export function readPuckBaseRules(): Rule[] {
  const source = readFileSync(
    resolve(process.cwd(), "src/puck/styles/puck-base.css"),
    "utf8",
  );

  return parseRules(source.replace(/\/\*[\s\S]*?\*\//g, ""));
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
export function parseRules(
  source: string,
  media: string | null = null,
): Rule[] {
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

export function declarations(rule: Rule) {
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

/** Drops the custom-property declarations, keeping the box-affecting ones. */
export function authoredDeclarations(rule: Rule) {
  return new Map(
    [...declarations(rule)].filter(([property]) => !property.startsWith("--")),
  );
}
