import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
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

import { ProductType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS, getPermissionAlternatives } from "@/shared/lib/permissions";

import { reviewsRouter } from "../server/procedures";

const createCaller = createCallerFactory(reviewsRouter);
const caller = createCaller({ userId: "test-user" });

const productIds: string[] = [];
const reviewIds: string[] = [];

async function createProduct() {
  const product = await db.product.create({
    data: {
      title: `Product ${randomUUID()}`,
      slug: `product-${randomUUID()}`,
      type: ProductType.SERVICE,
      version: 1,
    },
  });
  productIds.push(product.id);
  return product;
}

async function createReview(productId: string, overrides: Record<string, unknown> = {}) {
  const review = await caller.create({
    reviewerName: `Reviewer ${randomUUID()}`,
    role: "Writer",
    rating: 5,
    comment: "Great product",
    date: new Date(),
    productId,
    verifiedPurchase: false,
    ...overrides,
  });
  reviewIds.push(review.id);
  return review;
}

beforeEach(() => {
  productIds.length = 0;
  reviewIds.length = 0;
});

afterEach(async () => {
  if (reviewIds.length > 0) {
    await db.reviews.deleteMany({ where: { id: { in: reviewIds } } });
  }
  if (productIds.length > 0) {
    await db.reviews.deleteMany({ where: { productId: { in: productIds } } });
    await db.product.deleteMany({ where: { id: { in: productIds } } });
  }
  productIds.length = 0;
  reviewIds.length = 0;
});

describe("reviewsRouter", () => {
  describe("create", () => {
    it("creates a review attached to a product, unpublished by default", async () => {
      const product = await createProduct();

      const created = await caller.create({
        reviewerName: "Ada Lovelace",
        role: "Sceneggiatrice",
        rating: 4.5,
        comment: "Molto utile",
        date: new Date("2024-01-01T00:00:00.000Z"),
        productId: product.id,
        verifiedPurchase: true,
      });

      expect(created.id).toBeTruthy();
      expect(created.reviewerName).toBe("Ada Lovelace");
      expect(created.role).toBe("Sceneggiatrice");
      expect(created.rating).toBe(4.5);
      expect(created.comment).toBe("Molto utile");
      expect(created.productId).toBe(product.id);
      expect(created.verifiedPurchase).toBe(true);
      expect(created.status).toBe(false);
    });

    it("does not accept a status flag in the input", async () => {
      const product = await createProduct();

      const created = await caller.create({
        reviewerName: "Grace Hopper",
        role: "Writer",
        rating: 5,
        comment: "Top",
        date: new Date(),
        productId: product.id,
        verifiedPurchase: false,
        status: true,
      } as never);

      expect(created.status).toBe(false);
    });
  });

  describe("update", () => {
    it("updates the editable fields and can move the review to another product", async () => {
      const first = await createProduct();
      const second = await createProduct();
      const review = await createReview(first.id);

      const updated = await caller.update({
        id: review.id,
        reviewerName: "Updated name",
        role: "Editor",
        rating: 3,
        comment: "Changed my mind",
        date: review.date,
        productId: second.id,
        verifiedPurchase: true,
      });

      expect(updated.reviewerName).toBe("Updated name");
      expect(updated.rating).toBe(3);
      expect(updated.productId).toBe(second.id);
      expect(updated.verifiedPurchase).toBe(true);
    });

    it("throws NOT_FOUND for an unknown review", async () => {
      const product = await createProduct();

      await expect(
        caller.update({
          id: randomUUID(),
          reviewerName: "Nope",
          role: "Writer",
          rating: 5,
          comment: "Nope",
          date: new Date(),
          productId: product.id,
          verifiedPurchase: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("getOne", () => {
    it("returns the review together with its product", async () => {
      const product = await createProduct();
      const review = await createReview(product.id);

      const loaded = await caller.getOne({ id: review.id });

      expect(loaded.id).toBe(review.id);
      expect(loaded.product.id).toBe(product.id);
    });

    it("throws NOT_FOUND for an unknown review", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("returns a paginated envelope with the product relation", async () => {
      const product = await createProduct();
      const review = await createReview(product.id);

      const result = await caller.getMany({
        page: 1,
        pageSize: 10,
        product: product.id,
      });

      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.items[0]?.id).toBe(review.id);
      expect(result.items[0]?.product.id).toBe(product.id);
    });

    it("filters by search over the reviewer name and comment", async () => {
      const product = await createProduct();
      const marker = randomUUID();
      await createReview(product.id, {
        reviewerName: `Searchable ${marker}`,
        comment: "nothing",
      });
      await createReview(product.id, {
        reviewerName: "Other",
        comment: `Contains ${marker} inside`,
      });
      await createReview(product.id, {
        reviewerName: "Unrelated",
        comment: "no match here",
      });

      const result = await caller.getMany({
        page: 1,
        pageSize: 100,
        search: marker,
      });

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it("filters by the publication status", async () => {
      const product = await createProduct();
      const draft = await createReview(product.id);
      const published = await createReview(product.id);
      await caller.publish({ id: published.id });

      const drafts = await caller.getMany({
        page: 1,
        pageSize: 100,
        product: product.id,
        status: false,
      });
      const live = await caller.getMany({
        page: 1,
        pageSize: 100,
        product: product.id,
        status: true,
      });

      expect(drafts.items.map((item) => item.id)).toContain(draft.id);
      expect(drafts.items.map((item) => item.id)).not.toContain(published.id);
      expect(live.items.map((item) => item.id)).toEqual([published.id]);
    });

    it("does not return reviews that do not match the search", async () => {
      const result = await caller.getMany({
        page: 1,
        pageSize: 10,
        search: randomUUID(),
      });

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("publish and unpublish", () => {
    it("toggles the boolean status flag", async () => {
      const product = await createProduct();
      const review = await createReview(product.id);

      const published = await caller.publish({ id: review.id });
      expect(published.status).toBe(true);

      const unpublished = await caller.unpublish({ id: review.id });
      expect(unpublished.status).toBe(false);
    });

    it("throws NOT_FOUND when publishing an unknown review", async () => {
      await expect(caller.publish({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("deletes the review", async () => {
      const product = await createProduct();
      const review = await createReview(product.id);

      await caller.remove({ id: review.id });

      const loaded = await db.reviews.findUnique({ where: { id: review.id } });
      expect(loaded).toBeNull();
      reviewIds.length = 0;
    });

    it("throws NOT_FOUND for an unknown review", async () => {
      await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("permissions", () => {
    it("resolves reviews.read and reviews.manage without a publish permission", () => {
      expect(getPermissionAlternatives(PERMISSIONS.REVIEWS_READ)).toEqual([
        PERMISSIONS.REVIEWS_READ,
      ]);
      expect(getPermissionAlternatives(PERMISSIONS.REVIEWS_MANAGE)).toEqual([
        PERMISSIONS.REVIEWS_MANAGE,
      ]);
    });
  });
});
