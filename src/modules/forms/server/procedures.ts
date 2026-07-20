import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { formInsertSchema, formUpdateSchema } from "../schemas";
import type { FormRootInstance } from "../builder/types/core";

export const formsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(formInsertSchema)
    .mutation(async ({ input }) => {
      const form = await db.form.create({
        data: {
          name: input.name,
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
  getMany: protectedProcedure.query(async () => {
    const forms = await db.form.findMany();

    return forms;
  }),
});
