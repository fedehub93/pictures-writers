import { isValidElement, type ReactElement, type ReactNode } from "react";

import { describe, expect, it } from "vitest";

import { ScriptStrategy } from "@/types";

import { AppScripts } from "../scripts";

function collectElements(
  node: ReactNode,
  elements: ReactElement[] = [],
): ReactElement[] {
  if (Array.isArray(node)) {
    node.forEach((child) => collectElements(child, elements));
    return elements;
  }

  if (!isValidElement(node)) {
    return elements;
  }

  elements.push(node);
  const children = (node.props as { children?: ReactNode }).children;

  if (children) {
    collectElements(children, elements);
  }

  return elements;
}

describe("AppScripts", () => {
  it("preserves the configured strategy, including beforeInteractive", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "iubenda-cs",
          strategy: ScriptStrategy.beforeInteractive,
          content: "window.__iubenda = true;",
          enabled: true,
        },
        {
          name: "iubenda-src",
          src: "https://cdn.iubenda.com/iubenda.js",
          strategy: ScriptStrategy.beforeInteractive,
          enabled: true,
        },
      ],
    });

    const strategies = collectElements(tree)
      .map((element) => (element.props as { strategy?: string }).strategy)
      .filter(Boolean);

    expect(strategies).toEqual([
      ScriptStrategy.beforeInteractive,
      ScriptStrategy.beforeInteractive,
    ]);
  });
});
