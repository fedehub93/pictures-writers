import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { NavbarBlockServer } from "../blocks/NavbarBlock/server";

describe("NavbarBlock server render", () => {
  it("resolves the menu links and forwards dimension and decoration", async () => {
    const element = await NavbarBlockServer({
      content: {
        items: [
          {
            type: "link",
            label: "Blog",
            link: { type: "external", url: "/blog/" },
          },
        ],
        layout: "compact",
      },
      dimension: { desktop: { marginTop: "12px" } },
      decoration: { desktop: { backgroundColor: "var(--accent)" } },
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain('href="/blog"');
    expect(html).toContain("puck-dim puck-deco");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--bgc-d:var(--accent)");
  });
});
