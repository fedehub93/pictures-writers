import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { NavbarBlockServer } from "../blocks/NavbarBlock/server";

describe("NavbarBlock server render", () => {
  it("resolves the menu links and forwards spacing and decoration", async () => {
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
      spacing: { desktop: { marginTop: "12px" } },
      decoration: { desktop: { backgroundColor: "var(--accent)" } },
      appearance: { desktop: { fontSize: "1.25rem" } },
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain('href="/blog"');
    expect(html).toContain("puck-dim puck-deco");
    expect(html).toContain("puck-block-root");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--bgc-d:var(--accent)");
    expect(html).toContain("--nav-fs-d:1.25rem");
    expect(html).toContain("--nav-fs-m:1.25rem");
  });
});
