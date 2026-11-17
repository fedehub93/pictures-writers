// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import type { LinkProps } from "../fields/link/types";
import { ButtonBlockUi } from "../blocks/Button/ui/button";
import type { ButtonContentProps } from "../blocks/Button/types";

/**
 * The static tests assert the props the Button hands its icon. This file
 * mounts the real `DynamicIcon`, which keeps no DOM until its glyph chunk
 * resolves, and observes the element that actually lands inside the anchor.
 */
const LINK: LinkProps = {
  type: "external",
  url: "https://example.com/",
  label: "Start Playing",
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
});

async function mount(button: ButtonContentProps) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root!.render(<ButtonBlockUi button={button} styleVars={{}} />);
  });

  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (container.querySelector("svg")) return container;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }

  return container;
}

describe("Button icon in the DOM", () => {
  it("renders the real icon inside the anchor, silent and one em wide", async () => {
    const host = await mount({
      link: LINK,
      icon: { name: "play" },
      iconPosition: "before",
    });

    const anchor = host.querySelector("a");
    const icon = anchor?.querySelector("svg");

    expect(anchor).not.toBeNull();
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute("aria-hidden")).toBe("true");
    expect(icon!.classList.contains("size-[1em]")).toBe(true);
    expect(anchor!.firstElementChild).toBe(icon);
    expect(anchor!.textContent).toContain("Start Playing");
    expect(anchor!.style.gap).toBe("0.5em");
  });

  it("puts the real icon after the text when asked", async () => {
    const host = await mount({
      link: LINK,
      icon: { name: "arrow-right" },
      iconPosition: "after",
    });

    const anchor = host.querySelector("a");
    const icon = anchor?.querySelector("svg");

    expect(icon).not.toBeNull();
    expect(anchor!.lastElementChild).toBe(icon);
    expect(anchor!.textContent).toContain("Start Playing");
  });
});
