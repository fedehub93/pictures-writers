import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { db } from "@/shared/lib/db";

import { getEmailsSentToday, sendEmail } from "../../lib/mail";
import { settingsTesterSchema, settingsUpdateSchema } from "../schemas";

export const settingsRouter = createTRPCRouter({
  update: protectedProcedure
    .input(settingsUpdateSchema)
    .mutation(async ({ input }) => {
      const updatedSettings = await db.emailSetting.update({
        where: { id: input.id },
        data: { ...input },
      });

      if (!updatedSettings) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Settings not found",
        });
      }

      return updatedSettings;
    }),
  get: protectedProcedure.query(async () => {
    const settings = await db.emailSetting.findFirst({});
    const emailSentToday = await getEmailsSentToday();

    if (!settings) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mail settings not found",
      });
    }

    return { ...settings, emailsSentToday: emailSentToday };
  }),
  test: protectedProcedure
    .input(settingsTesterSchema)
    .mutation(async ({ input }) => {
      const settings = await db.emailSetting.findFirst();
      if (!settings) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing Settings!",
        });
      }

      if (!settings.emailApiKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing API key!",
        });
      }

      if (!settings.emailSender) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing email sender!",
        });
      }

      const emailTemplate = await db.emailTemplate.findUnique({
        where: {
          id: input.emailTemplateId,
        },
      });

      if (!emailTemplate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email Template not found!",
        });
      }

      const html = emailTemplate.bodyHtml;

      await sendEmail({
        to: input.emailRecipient,
        from: `${settings.emailSenderName} <${settings.emailSender}>`,
        subject: "Email test",
        html: html ?? "Test",
        type: "free_email",
        replyTo: settings.emailResponse!,
      });

      return { status: "sent" };
    }),
});
