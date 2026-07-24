import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import {
  formSubmissionInsertSchema,
  formSubmissionUpdateSchema,
} from "../schemas";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

export const formSubmissionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(formSubmissionInsertSchema)
    .mutation(async ({ input }) => {
      const submission = await db.formSubmission.create({
        data: { ...input },
      });
      return submission;
    }),
  update: protectedProcedure
    .input(formSubmissionUpdateSchema)
    .mutation(async ({ input }) => {
      const updatedSubmission = await db.form.update({
        where: { id: input.id },
        data: { ...input },
      });

      if (!updatedSubmission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Form submission not found",
        });
      }

      return updatedSubmission;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.formSubmission.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const submission = await db.formSubmission.findUnique({
        where: {
          id: input.id,
        },
        include: {
          form: true,
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Form submission not found",
        });
      }

      return submission;
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
        formId: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const submissions = await db.formSubmission.findMany({
        where: {
          formId: input.formId ? input.formId : undefined,
          email: input.search ? { contains: input.search } : undefined,
        },
        include: {
          form: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });

      return submissions;
    }),
});
