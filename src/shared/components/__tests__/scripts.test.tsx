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

function collectStrategies(tree: ReactNode) {
  return collectElements(tree)
    .map((element) => (element.props as { strategy?: string }).strategy)
    .filter(Boolean);
}

describe("AppScripts", () => {
  it("keeps the iubenda loader early and defers sync", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "iubenda-config",
          strategy: ScriptStrategy.beforeInteractive,
          content: "window.__iubenda = true;",
          enabled: true,
        },
        {
          name: "iubenda-cs",
          src: "https://cdn.iubenda.com/cs/iubenda_cs.js",
          strategy: ScriptStrategy.beforeInteractive,
          enabled: true,
        },
        {
          name: "iubenda-sync",
          src: "https://cs.iubenda.com/sync/3303495.js",
          strategy: ScriptStrategy.beforeInteractive,
          enabled: true,
        },
      ],
    });

    expect(collectStrategies(tree)).toEqual([
      ScriptStrategy.beforeInteractive,
      ScriptStrategy.beforeInteractive,
      ScriptStrategy.lazyOnLoad,
    ]);
  });

  it("downgrades other external beforeInteractive scripts", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "critical-src",
          src: "https://example.com/critical.js",
          strategy: ScriptStrategy.beforeInteractive,
          enabled: true,
        },
      ],
    });

    expect(collectStrategies(tree)).toEqual([
      ScriptStrategy.afterInteractive,
    ]);
  });

  it("normalizes protocol-relative sources to https", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "iubenda-cs",
          src: "//cdn.iubenda.com/cs/iubenda_cs.js",
          strategy: ScriptStrategy.beforeInteractive,
          enabled: true,
        },
      ],
    });

    const srcs = collectElements(tree)
      .map((element) => (element.props as { src?: string }).src)
      .filter(Boolean);

    expect(srcs).toEqual(["https://cdn.iubenda.com/cs/iubenda_cs.js"]);
  });
});
