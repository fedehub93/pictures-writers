import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { contactInsertSchema, contactUpdateSchema } from "../schemas";

import {
  syncContactWithProvider,
  propagateContactCreate,
  propagateContactUpdate,
  deleteContactOnProvider,
} from "../../lib/core";

import { getEmailContactsGrowth } from "./data";

export const contactsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(contactInsertSchema)
    .mutation(async ({ input }) => {
      const contact = await db.emailContact.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          isSubscriber: input.isSubscriber,
          audiences: input.audiences?.length
            ? {
                connect: input.audiences.map((a: { id: string }) => ({
                  id: a.id,
                })),
              }
            : undefined,
        },
      });

      // Propagate to provider — non-blocking
      const propagation = await propagateContactCreate(contact.id);

      return {
        ...contact,
        propagationWarning: propagation.propagationWarning ?? null,
      };
    }),
  update: protectedProcedure
    .input(contactUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, audiences, interactions, ...scalarFields } = input;

      const updatedContact = await db.$transaction(async (tx) => {
        // A. Aggiorna il contatto e la relazione N:M (audiences)
        const contact = await tx.emailContact.update({
          where: { id },
          data: {
            ...scalarFields,
            audiences: audiences
              ? {
                  set: audiences.map((a: { id: string }) => ({
                    id: a.id,
                  })),
                }
              : undefined,
            interactions: undefined,
          },
        });

        await tx.emailContactInteraction.deleteMany({
          where: { contactId: id },
        });

        if (interactions.length > 0) {
          await tx.emailContactInteraction.createMany({
            data: interactions.map((interaction: { id: string }) => ({
              contactId: id,
              interactionType: interaction.id,
              interactionDate: new Date(),
            })),
          });
        }

        return contact;
      });

      if (!updatedContact) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      // Propagate to provider — non-blocking
      const propagation = await propagateContactUpdate(id);

      return {
        ...updatedContact,
        propagationWarning: propagation.propagationWarning ?? null,
      };
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Delete on provider first — non-blocking
      let propagationWarning: string | null = null;
      try {
        await deleteContactOnProvider(input.id);
      } catch (error) {
        console.error("[contacts.remove] Provider deletion failed:", error);
        propagationWarning =
          error instanceof Error ? error.message : "Unknown propagation error";
      }

      const deleted = await db.emailContact.delete({
        where: { id: input.id },
      });

      return { ...deleted, propagationWarning };
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const contact = await db.emailContact.findUnique({
        where: { id: input.id },
        include: { interactions: true, audiences: true },
      });

      if (!contact) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      return contact;
    }),
  getMany: protectedProcedure
    .input(z.object({ audienceId: z.string().optional() }))
    .query(async ({ input }) => {
      const contacts = await db.emailContact.findMany({
        where: {
          audiences:
            input.audienceId && input.audienceId.toUpperCase() !== "ALL"
              ? {
                  some: {
                    id: input.audienceId,
                  },
                }
              : undefined,
        },
        include: { interactions: true, audiences: true },
        orderBy: { createdAt: "desc" },
      });

      return contacts;
    }),
  sync: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await syncContactWithProvider(input.id);

        return {
          message: "Sync successfully",
          ...result,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Qualcosa è andato storto durante il sync",
        });
      }
    }),
  getContactsGrowth: protectedProcedure
    .input(
      z.object({
        from: z.iso.datetime({ message: "Invalid 'from' date format" }),
        to: z.iso.datetime({ message: "Invalid 'to' date format" }),
      }),
    )
    .query(async ({ input }) => {
      const { from, to } = input;

      try {
        const startDate = new Date(from);
        const endDate = new Date(to);

        const mailContactStats = await getEmailContactsGrowth(
          startDate,
          endDate,
        );

        if (!mailContactStats) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to generate contact growth stats",
          });
        }

        return mailContactStats;
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        console.error("[CONTACT_STATS]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Error",
        });
      }
    }),
});
