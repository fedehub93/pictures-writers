import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import {
  formSubmissionInsertSchema,
  formSubmissionUpdateSchema,
} from "../schemas";
import {
  deleteOwnedFileObjects,
  reportOwnedFileCleanupFailures,
} from "@/modules/media/server/owned-file";
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
      const updatedSubmission = await db.formSubmission.update({
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
      // Read the attachments before the cascade removes their roles: the
      // objects can only be removed through the driver each file records.
      const submission = await db.formSubmission.findUnique({
        where: { id: input.id },
        select: {
          attachments: {
            select: {
              storedFile: { select: { id: true, key: true, driver: true } },
            },
          },
        },
      });
      const storedFiles =
        submission?.attachments.map((attachment) => attachment.storedFile) ??
        [];

      const deleted = await db.formSubmission.delete({
        where: {
          id: input.id,
        },
      });

      if (storedFiles.length > 0) {
        try {
          reportOwnedFileCleanupFailures(
            { formSubmissionId: input.id },
            await deleteOwnedFileObjects(storedFiles),
          );
        } catch (error) {
          console.error("[FORM_SUBMISSIONS] attachment cleanup failed", {
            formSubmissionId: input.id,
            error,
          });
        }
      }

      return deleted;
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
      const where = {
        formId: input.formId ? input.formId : undefined,
        email: input.search ? { contains: input.search } : undefined,
      };

      const submissions = await db.formSubmission.findMany({
        where,
        include: {
          form: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });

      const total = await db.formSubmission.count({ where });

      const totalPages = Math.ceil(total / input.pageSize);

      return {
        items: submissions,
        total,
        totalPages,
      };
    }),
});
