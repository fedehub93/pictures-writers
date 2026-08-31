import { randomUUID } from "node:crypto";
import { describe, it, expect, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

import { publishPost, PublishPostError } from "../publish-post";

describe("publishPost workflow", () => {
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
        bodyData: [{ type: "paragraph", children: [{ text: "" }] }],
        rootId: explicitRootId,
        ...overrides,
      },
    });

    // If no explicit root was provided, make the post the root of its own tree
    // (this matches the production create flow and satisfies the self FK).
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

  afterEach(async () => {
    if (createdRootIds.length > 0) {
      await db.post.deleteMany({
        where: { rootId: { in: createdRootIds } },
      });
      createdRootIds.length = 0;
    }
  });

  describe("happy path", () => {
    it("publishes a DRAFT post and marks it as the latest version", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const post = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });

      const published = await publishPost({
        postId: post.id,
        rootId: post.rootId!,
        now,
      });

      expect(published.status).toBe(ContentStatus.PUBLISHED);
      expect(published.isLatest).toBe(true);
      expect(published.publishedAt.toISOString()).toBe(now.toISOString());
      expect(published.firstPublishedAt.toISOString()).toBe(now.toISOString());
    });

    it("publishes a CHANGED post, demotes the previous published version and preserves firstPublishedAt", async () => {
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");

      const versionOne = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });
      const rootId = versionOne.rootId;

      await publishPost({
        postId: versionOne.id,
        rootId,
        now: firstPublishAt,
      });

      const versionTwoFirstPublishedAt = new Date("2025-02-01T00:00:00.000Z");
      const versionTwo = await createPost({
        rootId,
        title: "Test Post",
        slug: "test-post",
        version: 2,
        status: ContentStatus.CHANGED,
        firstPublishedAt: versionTwoFirstPublishedAt,
        publishedAt: versionTwoFirstPublishedAt,
      });
      trackRootId(rootId);

      const secondPublishAt = new Date("2025-06-01T00:00:00.000Z");
      const published = await publishPost({
        postId: versionTwo.id,
        rootId,
        now: secondPublishAt,
      });

      expect(published.status).toBe(ContentStatus.PUBLISHED);
      expect(published.isLatest).toBe(true);
      expect(published.publishedAt.toISOString()).toBe(
        secondPublishAt.toISOString(),
      );
      expect(published.firstPublishedAt.toISOString()).toBe(
        versionTwoFirstPublishedAt.toISOString(),
      );

      const previousVersion = await db.post.findUnique({
        where: { id: versionOne.id },
      });

      expect(previousVersion?.status).toBe(ContentStatus.PUBLISHED);
      expect(previousVersion?.isLatest).toBe(false);
    });
  });

  describe("idempotency", () => {
    it("does not publish a second time when called repeatedly on the same version", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const post = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });

      const firstResult = await publishPost({
        postId: post.id,
        rootId: post.rootId!,
        now,
      });
      const secondResult = await publishPost({
        postId: post.id,
        rootId: post.rootId!,
        now: new Date("2025-12-31T23:59:59.000Z"),
      });

      expect(secondResult.status).toBe(ContentStatus.PUBLISHED);
      expect(secondResult.publishedAt.toISOString()).toBe(
        firstResult.publishedAt.toISOString(),
      );
      expect(secondResult.firstPublishedAt.toISOString()).toBe(
        firstResult.firstPublishedAt.toISOString(),
      );
      expect(secondResult.isLatest).toBe(true);
    });

    it("handles concurrent publish requests on the same version without duplicate publications", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const post = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });

      const results = await Promise.all([
        publishPost({ postId: post.id, rootId: post.rootId!, now }),
        publishPost({
          postId: post.id,
          rootId: post.rootId!,
          now: new Date("2025-12-31T23:59:59.000Z"),
        }),
      ]);

      const publishedAts = results.map((r) => r.publishedAt.toISOString());
      expect(new Set(publishedAts).size).toBe(1);
      expect(results.every((r) => r.status === ContentStatus.PUBLISHED)).toBe(
        true,
      );
      expect(results.every((r) => r.isLatest === true)).toBe(true);
    });
  });

  describe("validation", () => {
    it("throws when the post does not exist", async () => {
      await expect(
        publishPost({ postId: randomUUID(), rootId: randomUUID() }),
      ).rejects.toBeInstanceOf(PublishPostError);
    });

    it("throws when the post title is missing", async () => {
      const post = await createPost({ title: "" });

      await expect(
        publishPost({ postId: post.id, rootId: post.rootId! }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "Missing required fields",
      });
    });

    it("is a no-op when the target version is already published", async () => {
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");
      const versionOne = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });
      const rootId = versionOne.rootId;

      await publishPost({
        postId: versionOne.id,
        rootId,
        now: firstPublishAt,
      });

      const versionTwo = await createPost({
        rootId,
        title: "Test Post",
        slug: "test-post",
        version: 2,
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        firstPublishedAt: firstPublishAt,
        publishedAt: firstPublishAt,
      });
      trackRootId(rootId);

      // Ensure only versionTwo is marked as latest, matching the real invariant.
      await db.post.update({
        where: { id: versionOne.id },
        data: { isLatest: false },
      });

      const later = new Date("2025-12-31T23:59:59.000Z");
      const result = await publishPost({
        postId: versionOne.id,
        rootId,
        now: later,
      });

      expect(result.status).toBe(ContentStatus.PUBLISHED);
      expect(result.publishedAt.toISOString()).toBe(
        firstPublishAt.toISOString(),
      );
      expect(result.isLatest).toBe(false);

      const latestVersion = await db.post.findUnique({
        where: { id: versionTwo.id },
      });
      expect(latestVersion?.isLatest).toBe(true);
    });
  });

  describe("observable state for repeated manual publish", () => {
    it("keeps publishedAt and isLatest stable after a no-op publish", async () => {
      const now = new Date("2025-03-15T08:30:00.000Z");
      const post = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });

      const published = await publishPost({
        postId: post.id,
        rootId: post.rootId!,
        now,
      });
      const republished = await publishPost({
        postId: post.id,
        rootId: post.rootId!,
        now: new Date("2025-04-01T00:00:00.000Z"),
      });

      expect(republished.id).toBe(published.id);
      expect(republished.status).toBe(ContentStatus.PUBLISHED);
      expect(republished.isLatest).toBe(true);
      expect(republished.publishedAt.toISOString()).toBe(now.toISOString());
    });
  });
});
