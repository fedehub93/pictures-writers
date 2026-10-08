import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the protected procedure for a plain one so the round-trip can be
// exercised against the test database without a session.
vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

import { createCallerFactory } from "@/trpc/init";

import { db } from "@/shared/lib/db";

import { tagsRouter } from "../procedures";
import { getPublishedTagBySlug } from "../queries";

const createCaller = createCallerFactory(tagsRouter);

const tagIds: string[] = [];
const postIds: string[] = [];
const userIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let userId: string;

async function createTag(overrides: Record<string, unknown> = {}) {
  const tag = await caller.create({
    title: `Tag ${randomUUID()}`,
    slug: `tag-${randomUUID()}`,
    ...overrides,
  });
  tagIds.push(tag.id);
  return tag;
}

async function createPost() {
  const post = await db.post.create({
    data: {
      title: `Post ${randomUUID()}`,
      slug: `post-${randomUUID()}`,
      version: 1,
    },
  });
  postIds.push(post.id);
  return post;
}

beforeEach(async () => {
  tagIds.length = 0;
  postIds.length = 0;
  userIds.length = 0;

  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  userId = user.id;
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  if (tagIds.length > 0) {
    const tags = await db.tag.findMany({
      where: { id: { in: tagIds } },
      select: { seoId: true },
    });
    const seoIds = [
      ...new Set(tags.map((tag) => tag.seoId).filter(Boolean)),
    ] as string[];

    await db.tag.deleteMany({ where: { id: { in: tagIds } } });
    if (seoIds.length > 0) {
      await db.seo.deleteMany({ where: { id: { in: seoIds } } });
    }
  }
  if (postIds.length > 0) {
    await db.post.deleteMany({ where: { id: { in: postIds } } });
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }

  tagIds.length = 0;
  postIds.length = 0;
  userIds.length = 0;
});

describe("tagsRouter", () => {
  describe("create", () => {
    it("creates exactly one row with a linked SEO", async () => {
      const before = await db.tag.count();
      const created = await createTag({
        title: "Writing tips",
        slug: `writing-tips-${randomUUID()}`,
      });

      expect(await db.tag.count()).toBe(before + 1);
      const rows = await db.tag.findMany({ where: { id: created.id } });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.userId).toBe(userId);

      const loaded = await caller.getOne({ id: created.id });
      expect(loaded.seoId).toBeTruthy();
      expect(loaded.seo?.title).toBe("Writing tips");
    });

    it("does not expose versioning fields", async () => {
      const created = await createTag();

      expect("rootId" in created).toBe(false);
      expect("version" in created).toBe(false);
      expect("isLatest" in created).toBe(false);
      expect("status" in created).toBe(false);
    });
  });

  describe("update", () => {
    it("mutates the single row in place", async () => {
      const created = await createTag({ title: "Old title" });
      const before = await db.tag.count();

      const updated = await caller.update({
        id: created.id,
        title: "New title",
        slug: `new-slug-${randomUUID()}`,
        description: "Updated description",
      });

      expect(await db.tag.count()).toBe(before);
      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe("New title");
      expect(updated.description).toBe("Updated description");

      const rows = await db.tag.findMany({ where: { title: "New title" } });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.id).toBe(created.id);
    });

    it("throws NOT_FOUND for an unknown tag", async () => {
      await expect(
        caller.update({ id: randomUUID(), title: "Nope" }),
      ).rejects.toThrow();
    });
  });

  describe("updateSeo", () => {
    it("updates the linked SEO row in place", async () => {
      const created = await createTag();
      const before = await caller.getOne({ id: created.id });
      const countBefore = await db.tag.count();

      const seo = await caller.updateSeo({
        id: created.id,
        title: "SEO title",
        description: "SEO description",
        noIndex: true,
        noFollow: false,
      });

      expect(seo.id).toBe(before.seoId);
      expect(seo.title).toBe("SEO title");
      expect(seo.description).toBe("SEO description");
      expect(seo.noIndex).toBe(true);
      expect(await db.tag.count()).toBe(countBefore);
    });

    it("throws NOT_FOUND for an unknown tag", async () => {
      await expect(
        caller.updateSeo({
          id: randomUUID(),
          noIndex: false,
          noFollow: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("removes the row, its SEO, and clears post links", async () => {
      const created = await createTag();
      const post = await createPost();
      await db.post.update({
        where: { id: post.id },
        data: { tags: { connect: { id: created.id } } },
      });
      const loaded = await caller.getOne({ id: created.id });

      await caller.remove({ id: created.id });

      expect(await db.tag.findUnique({ where: { id: created.id } })).toBeNull();
      expect(
        await db.seo.findUnique({ where: { id: loaded.seoId! } }),
      ).toBeNull();

      const linked = await db.post.findUniqueOrThrow({
        where: { id: post.id },
        include: { tags: true },
      });
      expect(linked.tags).toHaveLength(0);
    });

    it("throws NOT_FOUND for an unknown tag", async () => {
      await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getOne", () => {
    it("returns the row with its SEO", async () => {
      const created = await createTag();

      const loaded = await caller.getOne({ id: created.id });

      expect(loaded.id).toBe(created.id);
      expect(loaded.seoId).toBeTruthy();
    });

    it("throws NOT_FOUND for an unknown tag", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("returns a paginated envelope of one row per item", async () => {
      const marker = `Paginated ${randomUUID()}`;
      await createTag({ title: `${marker} A` });
      await createTag({ title: `${marker} B` });
      await createTag({ title: `${marker} C` });

      const first = await caller.getMany({
        page: 1,
        pageSize: 2,
        search: marker,
      });
      expect(first.total).toBe(3);
      expect(first.totalPages).toBe(2);
      expect(first.items).toHaveLength(2);

      const second = await caller.getMany({
        page: 2,
        pageSize: 2,
        search: marker,
      });
      expect(second.items).toHaveLength(1);
    });

    it("searches by title", async () => {
      const marker = `Searchable ${randomUUID()}`;
      const match = await createTag({ title: `${marker} match` });
      await createTag({ title: `Unrelated ${randomUUID()}` });

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.total).toBe(1);
      expect(result.items[0]!.id).toBe(match.id);
    });

    it("sorts by the requested field and direction", async () => {
      const marker = `Sort ${randomUUID()}`;
      const alpha = await createTag({ title: `${marker} Alpha` });
      const beta = await createTag({ title: `${marker} Beta` });

      const ascending = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
        sort: "title",
        direction: "asc",
      });
      const descending = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
        sort: "title",
        direction: "desc",
      });

      expect(ascending.items.map((item) => item.id)).toEqual([
        alpha.id,
        beta.id,
      ]);
      expect(descending.items.map((item) => item.id)).toEqual([
        beta.id,
        alpha.id,
      ]);
    });
  });
});

describe("getPublishedTagBySlug", () => {
  it("resolves the row by its stable slug", async () => {
    const slug = `public-${randomUUID()}`;
    const created = await createTag({ slug });

    const loaded = await getPublishedTagBySlug(slug);

    expect(loaded?.id).toBe(created.id);
    expect(loaded?.slug).toBe(slug);
  });

  it("returns null for an unknown slug", async () => {
    expect(await getPublishedTagBySlug(`missing-${randomUUID()}`)).toBeNull();
  });
});
