import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import { BrandServer } from "../blocks/Brand/server";

async function setBrand(siteName: string, logoUrl: string) {
  const settings = await db.settings.findFirst({ select: { id: true } });

  if (settings) {
    await db.settings.update({
      where: { id: settings.id },
      data: { siteName, logoUrl },
    });
    return;
  }

  await db.settings.create({ data: { siteName, logoUrl } });
}

describe("Brand server render", () => {
  beforeEach(async () => {
    await setBrand("Acme Test Site", "/acme-logo.png");
  });

  it("reads the site name and logo from Settings", async () => {
    const element = await BrandServer({});

    const html = renderToStaticMarkup(element);

    expect(html).toContain("Acme Test Site");
    expect(html).toContain('src="/acme-logo.png"');
  });
});
