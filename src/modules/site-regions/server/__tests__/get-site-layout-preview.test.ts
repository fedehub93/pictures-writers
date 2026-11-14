import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Data } from "@puckeditor/core";

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { createSiteRegion } from "../create-site-region";
import { publishSiteRegionVersion } from "../publish-site-region";
import { saveSiteRegionVersion } from "../save-site-region";
import { getSiteLayoutPreview } from "../queries/get-site-layout-preview";

const userIds: string[] = [];
const formIds: string[] = [];

beforeEach(async () => {
  userIds.length = 0;
  formIds.length = 0;
  await db.siteRegion.deleteMany({});
});

afterEach(async () => {
  await db.siteRegion.deleteMany({});

  if (formIds.length > 0) {
    await db.form.deleteMany({ where: { id: { in: formIds } } });
  }

  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }

  userIds.length = 0;
  formIds.length = 0;
});

async function createUser({ canReadSiteLayout }: { canReadSiteLayout: boolean }) {
  const user = await db.user.create({
    data: {
      email: `preview-${randomUUID()}@example.com`,
      roleId: canReadSiteLayout ? "system-role-admin" : undefined,
    },
  });

  userIds.push(user.id);
  return user;
}

function textDocument(text: string): Data {
  return {
    root: {},
    content: [{ type: "Text", props: { id: `text-${text}`, text } }],
  } as unknown as Data;
}

function documentText(data: Data) {
  const content = data.content as Array<{ props?: { text?: string } }>;
  return content[0]?.props?.text;
}

async function publishRegion(key: "HEADER" | "FOOTER", userId: string, data: Data) {
  const created = await createSiteRegion({ key, userId });
  const saved = await saveSiteRegionVersion({
    id: created.id,
    rootId: created.rootId,
    puckData: data,
  });
  await publishSiteRegionVersion({ id: saved.id, rootId: saved.rootId });
  return saved;
}

describe("getSiteLayoutPreview", () => {
  it("returns the code defaults when no region row exists", async () => {
    const user = await createUser({ canReadSiteLayout: true });

    const preview = await getSiteLayoutPreview({ userId: user.id });

    expect(preview.header.state).toBe("default");
    expect(preview.footer.state).toBe("default");
    expect(preview.header.data.content[0]?.type).toBe("Brand");
    expect(preview.footer.data.content[0]?.type).toBe("Copyright");
  });

  it("returns the live version when the region is published", async () => {
    const user = await createUser({ canReadSiteLayout: true });
    await publishRegion("HEADER", user.id, textDocument("Published header"));

    const preview = await getSiteLayoutPreview({ userId: user.id });

    expect(preview.header.state).toBe("live");
    expect(documentText(preview.header.data)).toBe("Published header");
    expect(preview.footer.state).toBe("default");
  });

  it("shows the default for a never-published region, even with a draft", async () => {
    const user = await createUser({ canReadSiteLayout: true });
    const created = await createSiteRegion({ key: "HEADER", userId: user.id });
    await saveSiteRegionVersion({
      id: created.id,
      rootId: created.rootId,
      puckData: textDocument("Only a draft"),
    });

    const preview = await getSiteLayoutPreview({ userId: user.id });

    expect(preview.header.state).toBe("default");
    expect(preview.header.data.content[0]?.type).toBe("Brand");
  });

  it("returns the resolved, hydrated draft to a user with site_layout.read", async () => {
    const user = await createUser({ canReadSiteLayout: true });
    const live = await publishRegion(
      "HEADER",
      user.id,
      textDocument("Live header"),
    );

    const form = await db.form.create({
      data: {
        name: `Form ${randomUUID()}`,
        content: { fields: [] } as unknown as PrismaJson.FormContentState,
      },
    });
    formIds.push(form.id);

    const draftDocument = {
      root: {},
      content: [
        {
          type: "Form",
          props: {
            id: `form-${randomUUID()}`,
            form: { id: form.id },
          },
        },
        {
          type: "Button",
          props: {
            id: `link-${randomUUID()}`,
            link: {
              type: "external",
              url: "https://example.com/",
              label: "Example",
            },
          },
        },
      ],
    } as unknown as Data;

    const forked = await saveSiteRegionVersion({
      id: live.id,
      rootId: live.rootId,
      puckData: draftDocument,
    });

    const preview = await getSiteLayoutPreview({ userId: user.id });

    expect(preview.header.state).toBe("draft");

    const content = preview.header.data.content as unknown as Array<{
      type: string;
      props: { form?: { id: string; content?: unknown }; link?: unknown };
    }>;

    expect(content[0]?.props.form?.id).toBe(form.id);
    expect(content[0]?.props.form?.content).toEqual({ fields: [] });
    expect(content[1]?.props.link).toMatchObject({
      href: "https://example.com/",
      label: "Example",
    });

    // Rendering values are a clone: the stored draft keeps its SmartLink.
    const stored = await db.siteRegionVersion.findUniqueOrThrow({
      where: { id: forked.id },
    });
    const storedContent = stored.puckData as unknown as {
      content: Array<{ props: { link?: { type?: string } } }>;
    };
    expect(storedContent.content[1]?.props.link?.type).toBe("external");
  });

  it("never returns a draft to a user without site_layout.read", async () => {
    const user = await createUser({ canReadSiteLayout: false });
    const admin = await createUser({ canReadSiteLayout: true });
    const live = await publishRegion(
      "HEADER",
      admin.id,
      textDocument("Live header"),
    );

    await saveSiteRegionVersion({
      id: live.id,
      rootId: live.rootId,
      puckData: textDocument("Draft header"),
    });

    const preview = await getSiteLayoutPreview({ userId: user.id });

    expect(preview.header.state).toBe("live");
    expect(documentText(preview.header.data)).toBe("Live header");
  });

  it("falls back to the default when the live document is null", async () => {
    const user = await createUser({ canReadSiteLayout: true });
    const created = await createSiteRegion({ key: "HEADER", userId: user.id });

    await db.siteRegionVersion.update({
      where: { id: created.id },
      data: { puckData: Prisma.DbNull },
    });
    await publishSiteRegionVersion({ id: created.id, rootId: created.rootId });

    const preview = await getSiteLayoutPreview({ userId: user.id });

    expect(preview.header.state).toBe("default");
    expect(preview.header.data.content[0]?.type).toBe("Brand");
  });
});
