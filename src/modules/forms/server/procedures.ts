import z from "zod";
import { db } from "@/shared/lib/db";

import { Prisma } from "@/generated/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { formInsertSchema, formUpdateSchema } from "../schemas";
import type { FormRootInstance } from "../builder/types/core";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

export const formsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(formInsertSchema)
    .mutation(async ({ input }) => {
      const form = await db.form.create({
        data: {
          ...input,
          content: {
            id: "root",
            type: "Root",
            isContainer: true,
            children: [],
            properties: {
              submission: {
                onSuccess: {
                  type: "toast",
                  successMessage: "Form submitted successfully!",
                },
              },
            },
          },
        },
      });
      return form;
    }),
  update: protectedProcedure
    .input(formUpdateSchema)
    .mutation(async ({ input }) => {
      const updatedForm = await db.form.update({
        where: { id: input.id },
        data: { ...input },
      });

      if (!updatedForm) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Form not found",
        });
      }

      return updatedForm;
    }),
  updateContent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.custom<FormRootInstance>(),
      }),
    )
    .mutation(async ({ input }) => {
      const updatedForm = await db.form.update({
        where: { id: input.id },
        data: { content: input.content },
      });

      if (!updatedForm) throw new TRPCError({ code: "NOT_FOUND" });
      return updatedForm;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.form.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const form = await db.form.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Form not found",
        });
      }

      return form;
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
      const where: Prisma.FormWhereInput = {
        name: input.search
          ? { contains: input.search, mode: "insensitive" }
          : undefined,
      };

      const forms = await db.form.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });

      const total = await db.form.count({ where });

      const totalPages = Math.ceil(total / input.pageSize);

      return {
        items: forms,
        total,
        totalPages,
      };
    }),
});
