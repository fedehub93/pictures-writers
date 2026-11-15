import { randomUUID } from "node:crypto";

import type { Data } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { ButtonProps } from "@/puck/blocks/Button/types";
import type { LegacyLinkProps, LinkProps } from "@/puck/fields/link/types";
import { PuckRender } from "@/puck/render-config";

import { getDraftPageBySlug, getPublishedPageBySlug } from "../queries";

const rootIds: string[] = [];

function unique(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

type PageOptions = {
  title: string;
  status?: ContentStatus;
  published?: boolean;
  puckData?: unknown;
};

/**
 * A Page root with one version. The draft read follows `currentVersion`, the
 * published read follows `liveVersion`, so the two pointers are set
 * independently: a page can be published and then edited into a new draft.
 */
async function createPage({
  title,
  status = ContentStatus.DRAFT,
  published = false,
  puckData = null,
}: PageOptions) {
  const slug = unique("page");
  const root = await db.pageRoot.create({
    data: {
      slug,
      versions: {
        create: {
          title,
          version: 1,
          status,
          publishedAt: published ? new Date() : null,
          ...(puckData === null
            ? {}
            : { puckData: puckData as PrismaJson.PuckData }),
        },
      },
    },
    include: { versions: true },
  });

  rootIds.push(root.id);

  await db.pageRoot.update({
    where: { id: root.id },
    data: {
      currentVersionId: root.versions[0]!.id,
      ...(published
        ? {
            liveVersionId: root.versions[0]!.id,
            firstPublishedAt: new Date(),
          }
        : {}),
    },
  });

  return { root, slug };
}

/**
 * Forks a newer current version on a root that already has a live version, the
 * shape a published page takes after an editor saves a change.
 */
async function addDraftVersion(
  rootId: string,
  { title, puckData }: { title: string; puckData: unknown },
) {
  const version = await db.pageVersion.create({
    data: {
      rootId,
      title,
      version: 2,
      status: ContentStatus.CHANGED,
      puckData: puckData as PrismaJson.PuckData,
    },
  });

  await db.pageRoot.update({
    where: { id: rootId },
    data: { currentVersionId: version.id },
  });

  return version;
}

type StoredButtonDocument = {
  content: Array<{ type: "Button"; props: ButtonProps }>;
};

function documentWithButton(link: LinkProps | LegacyLinkProps) {
  return {
    root: {},
    content: [{ type: "Button", props: { id: "button", button: { link } } }],
  };
}

/**
 * Renders the draft document through the same public Puck config the
 * `/draft/<slug>/` route uses, so the assertion is on the markup a visitor
 * gets rather than on the block in isolation.
 */
function renderDocument(puckData: unknown) {
  return renderToStaticMarkup(
    <PuckRender initialData={puckData as Data} />,
  );
}

afterEach(async () => {
  if (rootIds.length > 0) {
    await db.pageRoot.deleteMany({ where: { id: { in: rootIds } } });
  }
  rootIds.length = 0;
});

describe("Draft preview links", () => {
  it("resolves a Smart link when the draft page is read", async () => {
    const target = await createPage({
      title: "Pagina pubblicata",
      status: ContentStatus.PUBLISHED,
      published: true,
    });
    const source = await createPage({
      title: "Bozza",
      puckData: documentWithButton({ type: "page", pageId: target.root.id }),
    });

    const page = await getDraftPageBySlug(source.slug);
    const document = page!.puckData as StoredButtonDocument;

    // The same resolved shape the published read emits: the target's live
    // slug and title, not the draft document's Smart link.
    expect(document.content[0]!.props.button!.link).toEqual({
      label: "Pagina pubblicata",
      href: `/${target.slug}/`,
      openInNewTab: undefined,
    });
  });

  it("renders the resolved target as an anchor in the draft document", async () => {
    const target = await createPage({
      title: "Pagina pubblicata",
      status: ContentStatus.PUBLISHED,
      published: true,
    });
    const source = await createPage({
      title: "Bozza",
      puckData: documentWithButton({ type: "page", pageId: target.root.id }),
    });

    const page = await getDraftPageBySlug(source.slug);
    const html = renderDocument(page!.puckData);

    expect(html).toContain(`href="/${target.slug}"`);
    expect(html).toContain(">Pagina pubblicata</a>");
  });

  it("keeps a target without a live version as plain text", async () => {
    const draftTarget = await createPage({ title: "Pagina in bozza" });
    const source = await createPage({
      title: "Bozza",
      puckData: documentWithButton({
        type: "page",
        pageId: draftTarget.root.id,
        label: "Pagina in bozza",
      }),
    });

    const page = await getDraftPageBySlug(source.slug);
    const document = page!.puckData as StoredButtonDocument;

    // Nothing is resolved against the target's draft version: the preview
    // predicts what publishing this document would produce, and publishing
    // would not link a visitor to a 404.
    expect(document.content[0]!.props.button!.link).toEqual({
      label: "Pagina in bozza",
      href: undefined,
      openInNewTab: undefined,
    });

    const html = renderDocument(page!.puckData);
    expect(html).not.toContain("<a");
    expect(html).toContain(">Pagina in bozza</span>");
  });

  it("resolves an external URL exactly as the published page does", async () => {
    const source = await createPage({
      title: "Bozza",
      puckData: documentWithButton({
        type: "external",
        url: "https://example.com/",
        label: "Esempio",
      }),
    });

    const page = await getDraftPageBySlug(source.slug);
    const html = renderDocument(page!.puckData);

    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain(">Esempio</a>");
  });

  it("keeps a legacy { label, href } document untouched", async () => {
    const source = await createPage({
      title: "Bozza",
      puckData: documentWithButton({ label: "Legacy", href: "/legacy/" }),
    });

    const page = await getDraftPageBySlug(source.slug);
    const document = page!.puckData as StoredButtonDocument;

    expect(document.content[0]!.props.button!.link).toEqual({
      label: "Legacy",
      href: "/legacy/",
    });

    const html = renderDocument(page!.puckData);
    expect(html).toContain('href="/legacy"');
    expect(html).toContain(">Legacy</a>");
  });

  it("does not mutate the stored draft document", async () => {
    const target = await createPage({
      title: "Pagina pubblicata",
      status: ContentStatus.PUBLISHED,
      published: true,
    });
    const source = await createPage({
      title: "Bozza",
      puckData: documentWithButton({ type: "page", pageId: target.root.id }),
    });

    await getDraftPageBySlug(source.slug);

    const stored = await db.pageVersion.findUniqueOrThrow({
      where: { id: source.root.versions[0]!.id },
      select: { puckData: true },
    });
    const document = stored.puckData as unknown as StoredButtonDocument;

    // Resolution clones: the editor still reads the Smart link by identity.
    expect(document.content[0]!.props.button!.link).toEqual({
      type: "page",
      pageId: target.root.id,
    });
  });

  it("leaves the published read resolving Smart links", async () => {
    const target = await createPage({
      title: "Pagina pubblicata",
      status: ContentStatus.PUBLISHED,
      published: true,
    });
    const source = await createPage({
      title: "Pagina con link",
      status: ContentStatus.PUBLISHED,
      published: true,
      puckData: documentWithButton({ type: "page", pageId: target.root.id }),
    });

    const page = await getPublishedPageBySlug(source.slug);
    const html = renderDocument(page!.puckData);

    expect(html).toContain(`href="/${target.slug}"`);
    expect(html).toContain(">Pagina pubblicata</a>");
  });

  it("reads the live version when published and the current version in the preview", async () => {
    const liveTarget = await createPage({
      title: "Pagina live",
      status: ContentStatus.PUBLISHED,
      published: true,
    });
    const draftTarget = await createPage({
      title: "Pagina in bozza",
      status: ContentStatus.PUBLISHED,
      published: true,
    });
    const source = await createPage({
      title: "Pagina con link",
      status: ContentStatus.PUBLISHED,
      published: true,
      puckData: documentWithButton({
        type: "page",
        pageId: liveTarget.root.id,
      }),
    });
    const liveVersionId = source.root.versions[0]!.id;
    const draftVersion = await addDraftVersion(source.root.id, {
      title: "Pagina con link rivista",
      puckData: documentWithButton({
        type: "page",
        pageId: draftTarget.root.id,
      }),
    });

    const published = await getPublishedPageBySlug(source.slug);
    const draft = await getDraftPageBySlug(source.slug);

    // The two reads stay on their own versions: the live document points at
    // the live target, the draft document at the target it now names.
    expect(published!.id).toBe(liveVersionId);
    expect(draft!.id).toBe(draftVersion.id);
    expect(renderDocument(published!.puckData)).toContain(
      `href="/${liveTarget.slug}"`,
    );
    expect(renderDocument(draft!.puckData)).toContain(
      `href="/${draftTarget.slug}"`,
    );
  });
});
