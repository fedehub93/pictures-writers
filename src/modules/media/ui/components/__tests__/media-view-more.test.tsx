// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaViewMore } from "../media-view-more";

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(props: Partial<React.ComponentProps<typeof MediaViewMore>> = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(<MediaViewMore onClick={() => undefined} {...props} />);
  });

  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("MediaViewMore", () => {
  it("renders one button labelled View more", () => {
    const scope = mount();

    const buttons = scope.querySelectorAll("button");
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain("View more");
  });

  it("calls the click handler when activated", async () => {
    const onClick = vi.fn();
    const scope = mount({ onClick });

    await act(async () => {
      scope
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows a spinner and refuses a second activation while loading", () => {
    const scope = mount({ isLoading: true });
    const button = scope.querySelector("button")!;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.querySelector("svg")?.getAttribute("class")).toContain(
      "animate-spin",
    );
  });

  it("is an enabled button when it is not loading", () => {
    const scope = mount({ isLoading: false });
    const button = scope.querySelector("button")!;

    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-busy")).toBeNull();
  });
});
