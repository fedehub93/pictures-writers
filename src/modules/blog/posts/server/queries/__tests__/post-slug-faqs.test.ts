import { describe, it, expect, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

import { publishPost } from "../../../lib/publish-post";
import { createPostRoot } from "../../../lib/__tests__/root-fixtures";

import { getPublishedPostBySlug, getDraftPostBySlug } from "../index";

describe("Post slug queries – FAQ selection", () => {
  const rootIds: string[] = [];

  const trackRootId = (rootId: string) => {
    if (!rootIds.includes(rootId)) {
      rootIds.push(rootId);
    }
  };

  const createFaqs = async (versionId: string, sorts: number[]) => {
    await db.faq.createMany({
      data: sorts.map((sort) => ({
        postId: versionId,
        question: `Q-${sort}`,
        answer: `A-${sort}`,
        sort,
      })),
    });
  };

  afterEach(async () => {
    if (rootIds.length > 0) {
      await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
      rootIds.length = 0;
    }
  });

  describe("getPublishedPostBySlug", () => {
    it("selects faqs with question+answer only, ordered by sort asc", async () => {
      const { rootId, slug, version } = await createPostRoot({
        version: { status: ContentStatus.DRAFT },
      });
      trackRootId(rootId);

      await publishPost({
        id: version.id,
        rootId,
        now: new Date("2025-01-01T00:00:00.000Z"),
      });

      await createFaqs(version.id, [2, 0, 1]);

      const result = await getPublishedPostBySlug(slug);

      expect(result).not.toBeNull();
      expect(result!.faqs).toHaveLength(3);
      expect(result!.faqs.map((f) => f.question)).toEqual([
        "Q-0",
        "Q-1",
        "Q-2",
      ]);
      expect(result!.faqs.map((f) => f.answer)).toEqual(["A-0", "A-1", "A-2"]);
      expect(Object.keys(result!.faqs[0]!).sort()).toEqual([
        "answer",
        "question",
      ]);
    });

    it("returns an empty faqs array when the published post has no FAQs", async () => {
      const { rootId, slug, version } = await createPostRoot({
        version: { status: ContentStatus.DRAFT },
      });
      trackRootId(rootId);

      await publishPost({
        id: version.id,
        rootId,
        now: new Date("2025-01-01T00:00:00.000Z"),
      });

      const result = await getPublishedPostBySlug(slug);

      expect(result).not.toBeNull();
      expect(result!.faqs).toEqual([]);
    });
  });

  describe("getDraftPostBySlug", () => {
    it("selects faqs with question+answer only, ordered by sort asc", async () => {
      const { rootId, slug, version } = await createPostRoot({
        version: { status: ContentStatus.DRAFT },
      });
      trackRootId(rootId);

      await createFaqs(version.id, [2, 0, 1]);

      const result = await getDraftPostBySlug(slug);

      expect(result).not.toBeNull();
      expect(result!.faqs).toHaveLength(3);
      expect(result!.faqs.map((f) => f.question)).toEqual([
        "Q-0",
        "Q-1",
        "Q-2",
      ]);
      expect(result!.faqs.map((f) => f.answer)).toEqual(["A-0", "A-1", "A-2"]);
      expect(Object.keys(result!.faqs[0]!).sort()).toEqual([
        "answer",
        "question",
      ]);
    });

    it("returns an empty faqs array when the draft post has no FAQs", async () => {
      const { rootId, slug } = await createPostRoot({
        version: { status: ContentStatus.DRAFT },
      });
      trackRootId(rootId);

      const result = await getDraftPostBySlug(slug);

      expect(result).not.toBeNull();
      expect(result!.faqs).toEqual([]);
    });
  });
});
