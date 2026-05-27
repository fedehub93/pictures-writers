import z from "zod";
import { db } from "@/shared/lib/db";

import { AudienceType } from "@/generated/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { audienceInsertSchema, audienceUpdateSchema } from "../schemas";
import {
  syncContactsWithProvider,
  updateContactsAudience,
} from "../../lib/core";

export const audiencesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(audienceInsertSchema)
    .mutation(async ({ input }) => {
      const audience = await db.emailAudience.create({
        data: {
          name: input.name,
        },
      });
      return audience;
    }),
  update: protectedProcedure
    .input(audienceUpdateSchema)
    .mutation(async ({ input }) => {
      const updatedAudience = await db.emailAudience.update({
        where: { id: input.id },
        data: { ...input },
      });

      if (!updatedAudience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Audience not found",
        });
      }

      return updatedAudience;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.emailAudience.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const audience = await db.emailAudience.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!audience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Audience not found",
        });
      }

      return audience;
    }),
  getMany: protectedProcedure.query(async () => {
    const lists = await db.emailAudience.findMany({
      include: {
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const totalContacts = await db.emailContact.count();

    lists.unshift({
      id: "all",
      name: "All contacts",
      description: "All contacts",
      type: AudienceType.GLOBAL,
      externalId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        contacts: totalContacts,
      },
    });

    const mappedLists = lists.map((list) => ({
      ...list,
      totalContacts: list._count.contacts,
    }));

    return mappedLists;
  }),
  importContacts: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        interactions: z.array(z.any()).refine((arr) => arr.length > 0, {
          message: "Interactions cannot be empty",
        }),
        skip: z.number(),
        take: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, interactions, skip, take } = input;

      try {
        // 2. Chiamata alla logica di business per aggiornare i contatti
        const result = await updateContactsAudience(
          id,
          interactions,
          skip,
          take,
        );

        // 3. Risposta di successo
        return {
          message: "Import successfully",
          ...result,
        };
      } catch (error: any) {
        console.error("[EMAIL_AUDIENCE_ID_PATCH]", error);

        // Gestione degli errori generici del server (ex status 500)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Internal Error",
        });
      }
    }),
  getFilteredContactCount: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        interactions: z.array(z.string()).default([]),
      }),
    )
    .query(async ({ input }) => {
      const { id, interactions } = input;

      try {
        // 2. Recupera il conteggio dal DB applicando i filtri passati
        const totalContacts = await db.emailContact.count({
          where: {
            audiences: {
              none: {
                id,
              },
            },
            // Applichiamo il filtro solo se sono state passate delle interazioni
            ...(interactions.length > 0 && {
              interactions: {
                some: {
                  interactionType: { in: interactions },
                },
              },
            }),
          },
        });

        // 3. Risposta
        return {
          totalContacts,
        };
      } catch (error: any) {
        // Gestione degli errori (ex status 500)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to fetch filtered contact count",
        });
      }
    }),
  syncContacts: protectedProcedure
    .input(
      z.object({
        audienceId: z.string(),
        skip: z.number(),
        take: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { audienceId, skip, take } = input;

      try {
        // 2. Chiamata alla logica di business
        const result = await syncContactsWithProvider({
          skip,
          take,
          audienceId,
        });

        // 3. Gestione degli errori di business (ex status 400)
        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Errors: ${result.errors[0].email}: ${result.errors[0].reason}`,
          });
        }

        // 4. Risposta di successo
        return {
          message: "Sync successfully",
          ...result,
        };
      } catch (error: any) {
        // Se è già un errore tRPC (come il BAD_REQUEST sopra), lo rilanciamo
        if (error instanceof TRPCError) throw error;

        // Gestione degli errori generici del server (ex status 500)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "An unexpected error occurred",
        });
      }
    }),
  getContactCount: protectedProcedure
    .input(
      z.object({
        audienceId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { audienceId } = input;

      try {
        // 2. Eseguiamo il conteggio sul database
        const totalContacts = await db.emailContact.count({
          where: {
            audiences: {
              some: {
                id: audienceId,
              },
            },
          },
        });

        // 3. Ritorniamo il risultato pulito
        return {
          totalContacts,
        };
      } catch (error: any) {
        // Gestione degli errori del database o generici (ex status 500)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to fetch contact count",
        });
      }
    }),
});
