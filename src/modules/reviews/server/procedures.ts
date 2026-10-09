import z from "zod";

import { TRPCError } from "@trpc/server";

import { Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { revalidateContent } from "@/shared/lib/revalidate-content";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";
import { reviewInsertSchema, reviewUpdateSchema } from "../schemas";

const reviewProductSelect = {
  id: true,
  currentVersion: {
    select: {
      title: true,
      imageCover: { select: { url: true, altText: true } },
    },
  },
} satisfies Prisma.ProductRootSelect;

type ReviewProduct = Prisma.ProductRootGetPayload<{
  select: typeof reviewProductSelect;
}>;

const mapReviewProduct = (product: ReviewProduct) => ({
  id: product.id,
  title: product.currentVersion?.title ?? "",
  imageCover: product.currentVersion?.imageCover ?? null,
});

const reviewData = (input: {
  reviewerName: string;
  role: string;
  rating: number;
  comment?: string;
  date: Date;
  productId: string;
  verifiedPurchase: boolean;
}) => ({
  reviewerName: input.reviewerName,
  role: input.role,
  rating: input.rating,
  comment: input.comment,
  date: input.date,
  productId: input.productId,
  verifiedPurchase: input.verifiedPurchase,
});

const findReviewOrThrow = async (id: string) => {
  const review = await db.reviews.findUnique({ where: { id } });

  if (!review) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Review not found.",
    });
  }

  return review;
};

export const reviewsRouter = createTRPCRouter({
  create: permissionProcedure(PERMISSIONS.REVIEWS_MANAGE)
    .input(reviewInsertSchema)
    .mutation(async ({ input }) => {
      return db.reviews.create({ data: reviewData(input) });
    }),

  update: permissionProcedure(PERMISSIONS.REVIEWS_MANAGE)
    .input(reviewUpdateSchema)
    .mutation(async ({ input }) => {
      await findReviewOrThrow(input.id);

      return db.reviews.update({
        where: { id: input.id },
        data: reviewData(input),
      });
    }),

  remove: permissionProcedure(PERMISSIONS.REVIEWS_MANAGE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await findReviewOrThrow(input.id);

      return db.reviews.delete({ where: { id: input.id } });
    }),

  getOne: permissionProcedure(PERMISSIONS.REVIEWS_READ)
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const review = await db.reviews.findUnique({
        where: { id: input.id },
        include: {
          product: {
            select: reviewProductSelect,
          },
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found.",
        });
      }

      return { ...review, product: mapReviewProduct(review.product) };
    }),

  getMany: permissionProcedure(PERMISSIONS.REVIEWS_READ)
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        status: z.boolean().nullish(),
        product: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const search = input.search?.trim();
      const where: Prisma.ReviewsWhereInput = {
        status: input.status ?? undefined,
        productId: input.product ?? undefined,
        ...(search
          ? {
              OR: [
                {
                  reviewerName: { contains: search, mode: "insensitive" },
                },
                { comment: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        db.reviews.findMany({
          where,
          select: {
            id: true,
            rating: true,
            reviewerName: true,
            role: true,
            comment: true,
            date: true,
            status: true,
            verifiedPurchase: true,
            product: {
              select: reviewProductSelect,
            },
          },
          orderBy: { createdAt: "desc" },
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
        }),
        db.reviews.count({ where }),
      ]);

      return {
        items: items.map((item) => ({
          ...item,
          product: mapReviewProduct(item.product),
        })),
        total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  publish: permissionProcedure(PERMISSIONS.REVIEWS_MANAGE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await findReviewOrThrow(input.id);

      const review = await db.reviews.update({
        where: { id: input.id },
        data: { status: true },
      });

      revalidateContent("review");

      return review;
    }),

  unpublish: permissionProcedure(PERMISSIONS.REVIEWS_MANAGE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await findReviewOrThrow(input.id);

      const review = await db.reviews.update({
        where: { id: input.id },
        data: { status: false },
      });

      revalidateContent("review");

      return review;
    }),
});
