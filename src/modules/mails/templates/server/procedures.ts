import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { templateInsertSchema, templateUpdateSchema } from "../schemas";

export const templatesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(templateInsertSchema)
    .mutation(async ({ input }) => {
      const template = await db.emailTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          designData: input.designData,
          bodyHtml: input.bodyHtml,
        },
      });
      return template;
    }),

  update: protectedProcedure
    .input(templateUpdateSchema)
    .mutation(async ({ input }) => {
      const updatedTemplate = await db.emailTemplate.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          designData: input.designData,
          bodyHtml: input.bodyHtml,
        },
      });

      if (!updatedTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return updatedTemplate;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.emailTemplate.delete({
        where: {
          id: input.id,
        },
      });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const template = await db.emailTemplate.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return template;
    }),

  getMany: protectedProcedure.query(async () => {
    const templates = await db.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });

    return templates;
  }),
});
