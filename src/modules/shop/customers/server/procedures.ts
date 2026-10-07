import z from "zod";

import { TRPCError } from "@trpc/server";

import { Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { customerInsertSchema, customerUpdateSchema } from "../schemas";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

const toNullable = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const customerData = (input: {
  email: string;
  name?: string | null;
  phone?: string | null;
  notes?: string | null;
}) => ({
  email: input.email,
  name: toNullable(input.name),
  phone: toNullable(input.phone),
  notes: toNullable(input.notes),
});

const isUniqueEmailError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

export const customersRouter = createTRPCRouter({
  create: protectedProcedure
    .input(customerInsertSchema)
    .mutation(async ({ input }) => {
      try {
        return await db.customer.create({ data: customerData(input) });
      } catch (error) {
        if (isUniqueEmailError(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A customer with this email already exists.",
          });
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(customerUpdateSchema)
    .mutation(async ({ input }) => {
      const customer = await db.customer.findUnique({
        where: { id: input.id },
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found.",
        });
      }

      try {
        return await db.customer.update({
          where: { id: input.id },
          data: customerData(input),
        });
      } catch (error) {
        if (isUniqueEmailError(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A customer with this email already exists.",
          });
        }
        throw error;
      }
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const customer = await db.customer.findUnique({
        where: { id: input.id },
        include: { _count: { select: { orders: true } } },
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found.",
        });
      }

      if (customer._count.orders > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a customer that has orders.",
        });
      }

      return db.customer.delete({ where: { id: input.id } });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const customer = await db.customer.findUnique({
        where: { id: input.id },
        include: {
          orders: {
            include: { items: true },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found.",
        });
      }

      return customer;
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const search = input.search?.trim();
      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : undefined;

      const [items, total] = await Promise.all([
        db.customer.findMany({
          where,
          include: { _count: { select: { orders: true } } },
          orderBy: { createdAt: "desc" },
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
        }),
        db.customer.count({ where }),
      ]);

      return {
        items,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),
});
