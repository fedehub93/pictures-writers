import { describe, it, expect, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

import { publishPost } from "../../../lib/publish-post";
import { emptyTiptapDoc } from "../../../lib/__tests__/fixtures";

import { getPublishedPostBySlug, getDraftPostBySlug } from "../index";

describe("Post slug queries – FAQ selection", () => {
  const createdRootIds: string[] = [];

  const trackRootId = (rootId: string) => {
    if (!createdRootIds.includes(rootId)) {
      createdRootIds.push(rootId);
    }
  };

  const createPost = async (
    overrides: Partial<{
      title: string;
      slug: string;
      status: ContentStatus;
      rootId: string;
      isLatest: boolean;
    }> = {},
  ) => {
    const explicitRootId = overrides.rootId;
    const post = await db.post.create({
      data: {
        title: "Test Post",
        slug: "test-post",
        version: 1,
        status: ContentStatus.DRAFT,
        tiptapBodyData: emptyTiptapDoc,
        rootId: explicitRootId,
        ...overrides,
      },
    });

    const rootId = explicitRootId ?? post.id;
    if (!explicitRootId) {
      await db.post.update({
        where: { id: post.id },
        data: { rootId },
      });
    }

    trackRootId(rootId);
    return { ...post, rootId };
  };

  const createFaqs = async (postId: string, sorts: number[]) => {
    await db.faq.createMany({
      data: sorts.map((sort) => ({
        postId,
        question: `Q-${sort}`,
        answer: `A-${sort}`,
        sort,
      })),
    });
  };

  afterEach(async () => {
    if (createdRootIds.length > 0) {
      await db.post.deleteMany({
        where: { rootId: { in: createdRootIds } },
      });
      createdRootIds.length = 0;
    }
  });

  describe("getPublishedPostBySlug", () => {
    it("selects faqs with question+answer only, ordered by sort asc", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      const rootId = post.rootId;

      await publishPost({
        postId: post.id,
        rootId,
        now: new Date("2025-01-01T00:00:00.000Z"),
      });

      await createFaqs(post.id, [2, 0, 1]);

      const result = await getPublishedPostBySlug("test-post");

      expect(result).not.toBeNull();
      expect(result!.faqs).toHaveLength(3);
      expect(result!.faqs.map((f) => f.question)).toEqual([
        "Q-0",
        "Q-1",
        "Q-2",
      ]);
      expect(result!.faqs.map((f) => f.answer)).toEqual(["A-0", "A-1", "A-2"]);
      expect(Object.keys(result!.faqs[0]).sort()).toEqual(["answer", "question"]);
    });

    it("returns an empty faqs array when the published post has no FAQs", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      const rootId = post.rootId;

      await publishPost({
        postId: post.id,
        rootId,
        now: new Date("2025-01-01T00:00:00.000Z"),
      });

      const result = await getPublishedPostBySlug("test-post");

      expect(result).not.toBeNull();
      expect(result!.faqs).toEqual([]);
    });
  });

  describe("getDraftPostBySlug", () => {
    it("selects faqs with question+answer only, ordered by sort asc", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      await createFaqs(post.id, [2, 0, 1]);

      const result = await getDraftPostBySlug("test-post");

      expect(result).not.toBeNull();
      expect(result!.faqs).toHaveLength(3);
      expect(result!.faqs.map((f) => f.question)).toEqual([
        "Q-0",
        "Q-1",
        "Q-2",
      ]);
      expect(result!.faqs.map((f) => f.answer)).toEqual(["A-0", "A-1", "A-2"]);
      expect(Object.keys(result!.faqs[0]).sort()).toEqual(["answer", "question"]);
    });

    it("returns an empty faqs array when the draft post has no FAQs", async () => {
      await createPost({ status: ContentStatus.DRAFT });

      const result = await getDraftPostBySlug("test-post");

      expect(result).not.toBeNull();
      expect(result!.faqs).toEqual([]);
    });
  });
});