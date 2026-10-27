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

function collectSources(tree: ReactNode) {
  return collectElements(tree)
    .map((element) => (element.props as { src?: string }).src)
    .filter(Boolean);
}

describe("AppScripts", () => {
  it("degrades beforeInteractive scripts to afterInteractive", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "inline",
          strategy: ScriptStrategy.beforeInteractive,
          content: "window.__critical = true;",
          enabled: true,
        },
        {
          name: "external",
          src: "https://example.com/critical.js",
          strategy: ScriptStrategy.beforeInteractive,
          enabled: true,
        },
      ],
    });

    expect(collectStrategies(tree)).toEqual([
      ScriptStrategy.afterInteractive,
      ScriptStrategy.afterInteractive,
    ]);
  });

  it("passes the other strategies through unchanged", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "after",
          src: "https://example.com/after.js",
          strategy: ScriptStrategy.afterInteractive,
          enabled: true,
        },
        {
          name: "lazy",
          src: "https://example.com/lazy.js",
          strategy: ScriptStrategy.lazyOnLoad,
          enabled: true,
        },
        {
          name: "worker",
          src: "https://example.com/worker.js",
          strategy: ScriptStrategy.worker,
          enabled: true,
        },
      ],
    });

    expect(collectStrategies(tree)).toEqual([
      ScriptStrategy.afterInteractive,
      ScriptStrategy.lazyOnLoad,
      ScriptStrategy.worker,
    ]);
  });

  it("applies no provider-specific strategy rules", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "iubenda-cs",
          src: "https://cdn.iubenda.com/cs/iubenda_cs.js",
          strategy: ScriptStrategy.lazyOnLoad,
          enabled: true,
        },
        {
          name: "iubenda-sync",
          src: "https://cs.iubenda.com/sync/3303495.js",
          strategy: ScriptStrategy.afterInteractive,
          enabled: true,
        },
      ],
    });

    expect(collectStrategies(tree)).toEqual([
      ScriptStrategy.lazyOnLoad,
      ScriptStrategy.afterInteractive,
    ]);
  });

  it("skips disabled scripts", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "disabled",
          src: "https://example.com/disabled.js",
          strategy: ScriptStrategy.afterInteractive,
          enabled: false,
        },
      ],
    });

    expect(collectSources(tree)).toEqual([]);
  });

  it("normalizes protocol-relative sources to https", async () => {
    const tree = await AppScripts({
      scripts: [
        {
          name: "protocol-relative",
          src: "//cdn.example.com/script.js",
          strategy: ScriptStrategy.afterInteractive,
          enabled: true,
        },
      ],
    });

    expect(collectSources(tree)).toEqual(["https://cdn.example.com/script.js"]);
  });
});
