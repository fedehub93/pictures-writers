import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { emptyTiptapDoc } from "../../../lib/__tests__/fixtures";

import {
  getDraftPostBySlug,
  getLastPostByRootId,
  getPublishedPostByRootId,
  getPublishedPostBySlug,
} from "../index";

describe("post read paths via PostRoot + PostVersion", () => {
  const rootIds: string[] = [];
  const seoIds: string[] = [];

  beforeEach(() => {
    rootIds.length = 0;
    seoIds.length = 0;
  });

  afterEach(async () => {
    if (rootIds.length > 0) {
      await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
    }
    if (seoIds.length > 0) {
      await db.seo.deleteMany({ where: { id: { in: seoIds } } });
    }
  });

  const createSeo = async (title: string) => {
    const seo = await db.seo.create({ data: { title, version: 1 } });
    seoIds.push(seo.id);
    return seo;
  };

  const createPost = async ({ published }: { published: boolean }) => {
    const marker = randomUUID();
    const slug = `post-${marker}`;

    const root = await db.postRoot.create({
      data: {
        slug,
        firstPublishedAt: published ? new Date("2025-01-01") : null,
      },
    });
    rootIds.push(root.id);

    let liveVersionId: string | null = null;

    if (published) {
      const seo = await createSeo(`Live SEO ${marker}`);
      const live = await db.postVersion.create({
        data: {
          rootId: root.id,
          version: 1,
          status: ContentStatus.PUBLISHED,
          title: `Live ${marker}`,
          description: "live description",
          tiptapBodyData: emptyTiptapDoc,
          publishedAt: new Date("2025-01-01"),
          seoId: seo.id,
          faqs: {
            create: [
              { question: "Q1", answer: "A1", sort: 1 },
              { question: "Q0", answer: "A0", sort: 0 },
            ],
          },
        },
      });
      liveVersionId = live.id;
    }

    const currentSeo = await createSeo(`Current SEO ${marker}`);
    const current = await db.postVersion.create({
      data: {
        rootId: root.id,
        version: published ? 2 : 1,
        status: published ? ContentStatus.CHANGED : ContentStatus.DRAFT,
        title: `Current ${marker}`,
        description: "current description",
        tiptapBodyData: emptyTiptapDoc,
        seoId: currentSeo.id,
      },
    });

    await db.postRoot.update({
      where: { id: root.id },
      data: { currentVersionId: current.id, liveVersionId },
    });

    return {
      rootId: root.id,
      slug,
      liveVersionId,
      currentVersionId: current.id,
    };
  };

  it("resolves the live version by slug", async () => {
    const published = await createPost({ published: true });

    const result = await getPublishedPostBySlug(published.slug);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(published.liveVersionId);
    expect(result!.rootId).toBe(published.rootId);
    expect(result!.title).toMatch(/^Live /);
    expect(result!.slug).toBe(published.slug);
    expect(result!.firstPublishedAt).not.toBeNull();
    expect(result!.faqs.map((faq) => faq.question)).toEqual(["Q0", "Q1"]);
  });

  it("returns null from getPublishedPostBySlug when never published", async () => {
    const draftOnly = await createPost({ published: false });

    expect(await getPublishedPostBySlug(draftOnly.slug)).toBeNull();
  });

  it("resolves the current version by slug for draft reads", async () => {
    const published = await createPost({ published: true });

    const result = await getDraftPostBySlug(published.slug);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(published.currentVersionId);
    expect(result!.title).toMatch(/^Current /);
  });

  it("resolves getPublishedPostByRootId to the live version", async () => {
    const published = await createPost({ published: true });

    const result = await getPublishedPostByRootId(published.rootId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(published.liveVersionId);
    expect(result!.rootId).toBe(published.rootId);
    expect(result!.slug).toBe(published.slug);
  });

  it("resolves getLastPostByRootId to the current version", async () => {
    const published = await createPost({ published: true });

    const result = await getLastPostByRootId(published.rootId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(published.currentVersionId);
    expect(result!.slug).toBe(published.slug);
    expect(result!.status).toBe(ContentStatus.CHANGED);
  });
});
