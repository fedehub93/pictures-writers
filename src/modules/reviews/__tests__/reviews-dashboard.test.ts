import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { createProductRoot } from "@/modules/shop/products/lib/__tests__/root-fixtures";
import { db } from "@/shared/lib/db";

import { reviewsRouter } from "../server/procedures";

const createCaller = createCallerFactory(reviewsRouter);
const productIds: string[] = [];

async function createReview(status: boolean, title = "Prodotto") {
  const { root } = await createProductRoot({ title });
  productIds.push(root.id);

  const review = await db.reviews.create({
    data: {
      rating: 4,
      reviewerName: `Recensore ${randomUUID()}`,
      comment: "Commento",
      productId: root.id,
      status,
      date: new Date(),
    },
  });

  return { review, productId: root.id, title };
}

beforeEach(() => {
  productIds.length = 0;
});

afterEach(async () => {
  if (productIds.length > 0) {
    await db.productRoot.deleteMany({ where: { id: { in: productIds } } });
  }
  productIds.length = 0;
});

describe("reviews.getPendingReviews", () => {
  it("counts and lists unpublished reviews only", async () => {
    const pending = await createReview(false, "Prodotto A");
    await createReview(true, "Prodotto B");

    const result = await createCaller({
      userId: "any-user",
    }).getPendingReviews();

    expect(result.count).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(pending.review.id);
    expect(result.items[0]?.productTitle).toBe("Prodotto A");
  });
});
