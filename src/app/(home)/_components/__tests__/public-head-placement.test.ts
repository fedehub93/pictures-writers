import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const LAYOUT = path.resolve(process.cwd(), "src/app/(home)/layout.tsx");

describe("public root layout document structure", () => {
  const source = readFileSync(LAYOUT, "utf8");

  it("keeps the React-rendered head free of children", () => {
    expect(
      source,
      "Iubenda prepends its core script before the first <script> in the " +
        "document; React 19 hydrates a JSX <head> positionally, so any child " +
        "here reintroduces the hydration mismatch (ADR 0031).",
    ).toMatch(/<head\s*\/>|<head[^>]*>\s*<\/head>/);
  });

  it("renders the CMP block as the first child of the body", () => {
    expect(
      source,
      "The CMP must stay outside the hydrated head and at the top of <body>, " +
        "before any other public content (ADR 0031).",
    ).toMatch(/<body[^>]*>\s*<PublicHeadScripts/);
  });
});
