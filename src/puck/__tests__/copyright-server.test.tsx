import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import { CopyrightServer } from "../blocks/Copyright/server";

async function setSiteName(siteName: string) {
  const settings = await db.settings.findFirst({ select: { id: true } });

  if (settings) {
    await db.settings.update({
      where: { id: settings.id },
      data: { siteName },
    });
    return;
  }

  await db.settings.create({ data: { siteName } });
}

describe("Copyright server render", () => {
  beforeEach(async () => {
    await setSiteName("Acme Test Site");
  });

  it("reads the site name from Settings", async () => {
    const element = await CopyrightServer({ content: { showYear: true } });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("©");
    expect(html).toContain(String(new Date().getFullYear()));
    expect(html).toContain("Acme Test Site");
    expect(html).toContain("--fs-d:0.875rem");
  });

  it("forwards typography and spacing to the public markup", async () => {
    const element = await CopyrightServer({
      content: { showYear: true },
      typography: { desktop: { fontSize: "0.875rem" } },
      spacing: { desktop: { marginTop: "8px" } },
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("puck-dim puck-typo");
    expect(html).toContain("puck-block-root");
    expect(html).toContain("--fs-d:0.875rem");
    expect(html).toContain("--mt-d:8px");
  });

  it("renders the authored extra text and links", async () => {
    const element = await CopyrightServer({
      content: {
        showYear: true,
        extraText: "All rights reserved.",
        links: [
          {
            link: {
              type: "external",
              url: "https://example.com/",
              label: "Terms",
            },
          },
        ],
      },
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("All rights reserved.");
    expect(html).toContain(">Terms</a>");
  });
});
