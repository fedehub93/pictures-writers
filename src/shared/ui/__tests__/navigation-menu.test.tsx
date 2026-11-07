import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/shared/ui/navigation-menu";

function renderTrigger(props: { look?: "surface" | "plain" } = {}) {
  return renderToStaticMarkup(
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger {...props}>Servizi</NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  );
}

describe("NavigationMenuTrigger look", () => {
  it("keeps the surface look as the default", () => {
    const html = renderTrigger();

    expect(html).toContain("bg-background");
    expect(html).toContain("hover:bg-accent");
    expect(html).toContain("data-[state=open]:bg-accent/50");
    expect(html).not.toContain("bg-transparent");
  });

  it("renders the plain look without a surface", () => {
    const html = renderTrigger({ look: "plain" });

    expect(html).toContain("bg-transparent");
    expect(html).toContain("hover:text-primary");
    expect(html).toContain("data-[state=open]:bg-transparent");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).not.toContain("hover:bg-accent");
    expect(html).not.toContain("bg-accent");
  });
});
