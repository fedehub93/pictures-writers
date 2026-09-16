import { describe, it, expect, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

import { createNewVersion } from "../create-new-version";
import { publishPost } from "../publish-post";
import { emptyTiptapDoc } from "./fixtures";

describe("createNewVersion – FAQ handling", () => {
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
      version: number;
      rootId: string;
      isLatest: boolean;
      firstPublishedAt: Date;
      publishedAt: Date;
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

  const createFaqs = async (postId: string, count: number) => {
    const data = Array.from({ length: count }, (_, i) => ({
      postId,
      question: `Question ${i + 1}`,
      answer: `Answer ${i + 1}`,
      sort: i,
    }));

    await db.faq.createMany({ data });
    return db.faq.findMany({ where: { postId }, orderBy: { sort: "asc" } });
  };

  afterEach(async () => {
    if (createdRootIds.length > 0) {
      await db.post.deleteMany({
        where: { rootId: { in: createdRootIds } },
      });
      createdRootIds.length = 0;
    }
  });

  describe("Branch A – published → new CHANGED version", () => {
    it("creates FAQ rows against the new version's id", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      const rootId = post.rootId;

      await publishPost({ postId: post.id, rootId, now: new Date("2025-01-01T00:00:00.000Z") });
      const publishedFaqs = await createFaqs(post.id, 2);

      const newPost = await createNewVersion({
        rootId,
        faqs: [
          { id: publishedFaqs[0].id, question: "Q1?", answer: "A1", sort: 0 },
          { id: publishedFaqs[1].id, question: "Q2?", answer: "A2", sort: 1 },
        ],
      });

      expect(newPost.status).toBe(ContentStatus.CHANGED);
      expect(newPost.version).toBe(2);

      const newFaqs = await db.faq.findMany({
        where: { postId: newPost.id },
        orderBy: { sort: "asc" },
      });

      expect(newFaqs).toHaveLength(2);
      expect(newFaqs[0].question).toBe("Q1?");
      expect(newFaqs[0].postId).toBe(newPost.id);
      expect(newFaqs[1].question).toBe("Q2?");
      expect(newFaqs[1].postId).toBe(newPost.id);
    });

    it("does not touch the published version's FAQ rows", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      const rootId = post.rootId;

      await publishPost({ postId: post.id, rootId, now: new Date("2025-01-01T00:00:00.000Z") });
      await createFaqs(post.id, 2);

      const publishedFaqsBefore = await db.faq.findMany({
        where: { postId: post.id },
        orderBy: { sort: "asc" },
      });

      await createNewVersion({
        rootId,
        faqs: [{ question: "New Q?", answer: "New A", sort: 0 }],
      });

      const publishedFaqsAfter = await db.faq.findMany({
        where: { postId: post.id },
        orderBy: { sort: "asc" },
      });

      expect(publishedFaqsAfter).toHaveLength(2);
      expect(publishedFaqsAfter.map((f) => f.id).sort()).toEqual(
        publishedFaqsBefore.map((f) => f.id).sort(),
      );
    });

    it("copies existing FAQs from published version when input.faqs not provided", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      const rootId = post.rootId;

      await publishPost({ postId: post.id, rootId, now: new Date("2025-01-01T00:00:00.000Z") });
      await createFaqs(post.id, 2);

      const newPost = await createNewVersion({ rootId });

      expect(newPost.status).toBe(ContentStatus.CHANGED);

      const newFaqs = await db.faq.findMany({
        where: { postId: newPost.id },
        orderBy: { sort: "asc" },
      });

      expect(newFaqs).toHaveLength(2);
      expect(newFaqs[0].question).toBe("Question 1");
      expect(newFaqs[0].postId).toBe(newPost.id);
      expect(newFaqs[1].question).toBe("Question 2");
      expect(newFaqs[1].postId).toBe(newPost.id);
    });
  });

  describe("Branch B – draft/scheduled → existing", () => {
    it("deletes and creates FAQ rows against the existing post id", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      await createFaqs(post.id, 2);

      const updated = await createNewVersion({
        id: post.id,
        rootId: post.rootId,
        faqs: [
          { question: "Updated Q1?", answer: "Updated A1", sort: 0 },
          { question: "Updated Q2?", answer: "Updated A2", sort: 1 },
          { question: "Updated Q3?", answer: "Updated A3", sort: 2 },
        ],
      });

      expect(updated.id).toBe(post.id);

      const faqs = await db.faq.findMany({
        where: { postId: post.id },
        orderBy: { sort: "asc" },
      });

      expect(faqs).toHaveLength(3);
      expect(faqs[0].question).toBe("Updated Q1?");
      expect(faqs[1].question).toBe("Updated Q2?");
      expect(faqs[2].question).toBe("Updated Q3?");
    });

    it("leaves existing FAQs untouched when input.faqs not provided", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      await createFaqs(post.id, 2);

      await createNewVersion({
        id: post.id,
        rootId: post.rootId,
        title: "Updated title only",
      });

      const faqs = await db.faq.findMany({
        where: { postId: post.id },
        orderBy: { sort: "asc" },
      });

      expect(faqs).toHaveLength(2);
      expect(faqs[0].question).toBe("Question 1");
      expect(faqs[1].question).toBe("Question 2");
    });
  });

  describe("FAQ sort ordering (same select used by getLastByRootId)", () => {
    it("returns FAQs ordered by sort asc", async () => {
      const post = await createPost({ status: ContentStatus.DRAFT });
      const rootId = post.rootId;

      await publishPost({ postId: post.id, rootId, now: new Date("2025-01-01T00:00:00.000Z") });

      await db.faq.createMany({
        data: [
          { postId: post.id, question: "Q last", answer: "A last", sort: 2 },
          { postId: post.id, question: "Q first", answer: "A first", sort: 0 },
          { postId: post.id, question: "Q mid", answer: "A mid", sort: 1 },
        ],
      });

      const faqs = await db.faq.findMany({
        where: { postId: post.id },
        orderBy: { sort: "asc" },
        select: { id: true, question: true, answer: true, sort: true },
      });

      expect(faqs.map((f) => f.question)).toEqual([
        "Q first",
        "Q mid",
        "Q last",
      ]);
    });
  });
});
