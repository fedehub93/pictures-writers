import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { NavBadge } from "../nav-badge";

describe("nav badge", () => {
  it("renders the count when there is unread mail", () => {
    const html = renderToStaticMarkup(<NavBadge count={3} />);

    expect(html).toContain(">3<");
    expect(html).toContain('aria-label="3 unread conversations"');
  });

  it("renders nothing when the count is zero", () => {
    expect(renderToStaticMarkup(<NavBadge count={0} />)).toBe("");
  });

  it("renders nothing when no count applies", () => {
    expect(renderToStaticMarkup(<NavBadge count={undefined} />)).toBe("");
  });
});
