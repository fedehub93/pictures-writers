import z from "zod";
import { db } from "@/shared/lib/db";
import Handlebars from "handlebars";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { singleSendInsertSchema, singleSendUpdateSchema } from "../schemas";
import { sendBulk } from "../../lib/core";
import {
  scheduleSingleSend,
  rescheduleSingleSend,
  cancelScheduledSingleSend,
  SingleSendScheduleError,
} from "../lib/schedule-single-send";
import { getActiveScheduledActionByTarget } from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

export const singleSendsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(singleSendInsertSchema)
    .mutation(async ({ input }) => {
      const template = await db.emailTemplate.findUnique({
        where: {
          id: input.emailTemplateId,
        },
      });

      const singleSend = await db.emailSingleSend.create({
        data: {
          name: input.name,
          designData: template?.designData,
          bodyHtml: template?.bodyHtml,
        },
      });
      return singleSend;
    }),
  update: protectedProcedure
    .input(singleSendUpdateSchema)
    .mutation(async ({ input }) => {
      const updatedSingleSend = await db.emailSingleSend.update({
        where: {
          id: input.id,
        },
        data: {
          ...input,
          audiences: input.audiences
            ? {
                set: input.audiences.map((a) => ({
                  id: a.id,
                })),
              }
            : undefined,
        },
        include: {
          audiences: true,
        },
      });

      if (!updatedSingleSend) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Single send not found",
        });
      }

      return updatedSingleSend;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.emailSingleSend.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const singleSend = await db.emailSingleSend.findUnique({
        where: {
          id: input.id,
        },
        include: {
          audiences: true,
        },
      });

      if (!singleSend) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Single send not found",
        });
      }

      return singleSend;
    }),
  getMany: protectedProcedure.query(async () => {
    const singleSends = await db.emailSingleSend.findMany({
      include: {
        _count: {
          select: { emailSingleSendLogs: true },
        },
        audiences: {
          select: { _count: { select: { contacts: true } } },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedSingleSends = singleSends.map((s) => ({
      ...s, // Mantieni tutte le proprietà di 's'
      totalSends: s._count.emailSingleSendLogs,
      totalContacts: s.audiences.reduce(
        (total, a) => total + a._count.contacts,
        0,
      ), // Calcola il totale dei contatti
    }));

    return mappedSingleSends;
  }),
  getSchedule: protectedProcedure
    .input(z.object({ singleSendId: z.string() }))
    .query(async ({ input }) => {
      const action = await getActiveScheduledActionByTarget(
        SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
        input.singleSendId,
      );
      return action;
    }),

  schedule: protectedProcedure
    .input(
      z.object({
        singleSendId: z.string(),
        scheduledAt: z.coerce.date(),
        timezone: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await scheduleSingleSend({
          singleSendId: input.singleSendId,
          scheduledAt: input.scheduledAt,
          timezone: input.timezone,
        });
      } catch (error) {
        if (error instanceof SingleSendScheduleError) {
          const code =
            error.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : error.code === "CONFLICT"
                ? "CONFLICT"
                : "BAD_REQUEST";

          throw new TRPCError({
            code,
            message: error.message,
          });
        }

        throw error;
      }
    }),

  reschedule: protectedProcedure
    .input(
      z.object({
        singleSendId: z.string(),
        scheduledAt: z.coerce.date(),
        timezone: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await rescheduleSingleSend({
          singleSendId: input.singleSendId,
          scheduledAt: input.scheduledAt,
          timezone: input.timezone,
        });
      } catch (error) {
        if (error instanceof SingleSendScheduleError) {
          const code =
            error.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : error.code === "CONFLICT"
                ? "CONFLICT"
                : "BAD_REQUEST";

          throw new TRPCError({
            code,
            message: error.message,
          });
        }

        throw error;
      }
    }),

  cancelSchedule: protectedProcedure
    .input(z.object({ singleSendId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await cancelScheduledSingleSend({
          singleSendId: input.singleSendId,
        });
      } catch (error) {
        if (error instanceof SingleSendScheduleError) {
          throw new TRPCError({
            code: error.code === "NOT_FOUND" ? "NOT_FOUND" : "BAD_REQUEST",
            message: error.message,
          });
        }

        throw error;
      }
    }),

  sendBulk: protectedProcedure
    .input(
      z.object({
        singleSendId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { singleSendId } = input;

      // 1. Recupero i settings generali
      const settings = await db.emailSetting.findFirst();
      if (!settings || !settings.emailSender) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing or incomplete email settings",
        });
      }

      // 2. Recupero il single send includendo le audience per prendere l'externalId
      const singleSend = await db.emailSingleSend.findUnique({
        where: { id: singleSendId },
      });

      if (!singleSend || !singleSend.bodyHtml || !singleSend.subject) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wrong single send ID or missing template fields",
        });
      }

      // Prendiamo la prima audience legata al single send (o gestisci logiche multi-audience se necessario)

      const audiences = await db.emailAudience.findMany({
        where: {
          emailSingleSends: {
            some: {
              id: singleSendId,
            },
          },
          externalId: { not: null },
        },
      });

      if (!audiences || audiences.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Target audience is missing or not synchronized with the provider",
        });
      }

      const targetAudience = audiences[0];

      // 3. Compilazione del template (Logica globale o con tag del provider)

      const template = Handlebars.compile(singleSend.bodyHtml);
      const compiledHtml = template({}); // Variabili globali se ci sono

      const providerResult = await sendBulk({
        segmentExternalId: targetAudience.externalId!,
        subject: singleSend.subject,
        html: compiledHtml,
        from: `${settings.emailSenderName} <${settings.emailSender}>`,
        replyTo: settings.emailResponse || undefined,
      });

      if (!providerResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            providerResult.error ||
            "Failed to trigger bulk send on external provider",
        });
      }

      // 5. Scrittura log cumulativo (opzionale) o aggiornamento dello stato del Single Send
      await db.emailSingleSend.update({
        where: { id: singleSendId },
        data: {
          externalId: providerResult.externalCampaignId,
        },
      });

      return {
        status: "sent",
        externalCampaignId: providerResult.externalCampaignId,
      };
    }),
});
