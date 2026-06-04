"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { EmailProvider } from "@/generated/prisma";

import { Button } from "@/shared/ui/button";
import { Form } from "@/shared/ui/form";
import { Progress } from "@/shared/ui/progress";
import { GenericSelect } from "@/shared/components/form-component/generic-select";
import { GenericInput } from "@/shared/components/form-component/generic-input";
import { settingsUpdateSchema, SettingsUpdateValues } from "../../schemas";
import { SettingsGet } from "../../types";

interface EmailSettingsFormProps {
  settings: SettingsGet;
}

export const EmailSettingsForm = ({ settings }: EmailSettingsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const emailsSentPercentage =
    (settings.emailsSentToday / (settings?.maxEmailsPerDay || 0)) * 100;

  const form = useForm<SettingsUpdateValues>({
    resolver: zodResolver(settingsUpdateSchema),
    defaultValues: {
      id: settings.id,
      emailSenderName: settings.emailSenderName || "",
      emailSender: settings.emailSender || "",
      emailResponse: settings.emailResponse || "",
      emailProvider: settings.emailProvider || EmailProvider.SENDGRID,
      emailApiKey: process.env.NEXT_SENDGRID_KEY,
      maxEmailsPerDay: settings.maxEmailsPerDay || 100,
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const updateSettings = useMutation(
    trpc.mailSettings.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.mailSettings.get.queryOptions(),
        );
        toast.success("Settings updated successfully!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = async (values: SettingsUpdateValues) => {
    updateSettings.mutate(values);
  };

  const isPending = updateSettings.isPending;

  return (
    <div className="border p-4 w-full rounded">
      <h2 className="text-base text-muted-foreground">Configure your email</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
          <div className="flex flex-wrap gap-4">
            <GenericInput
              name="emailSenderName"
              control={form.control}
              containerProps={{ className: "min-w-40 flex-auto" }}
              label="Default sender name"
              disabled={isPending || isSubmitting}
              placeholder="support@pictureswriters.com"
            />

            <GenericInput
              name="emailSender"
              control={form.control}
              containerProps={{ className: "min-w-40 flex-auto" }}
              label="Default sender email"
              disabled={isPending || isSubmitting}
              placeholder="support@mail.pictureswriters.com"
            />

            <GenericInput
              name="emailResponse"
              control={form.control}
              containerProps={{ className: "min-w-40 flex-auto" }}
              label="Default response email"
              disabled={isPending || isSubmitting}
              placeholder="support@pictureswriters.com"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <GenericSelect
              name="emailProvider"
              control={form.control}
              label="Email Provider"
              options={[EmailProvider.SENDGRID, EmailProvider.RESEND]}
              containerProps={{ className: "min-w-40" }}
            />

            <GenericInput
              name="emailApiKey"
              control={form.control}
              containerProps={{ className: "grow" }}
              label="Email API key"
              type="password"
              disabled={isPending || isSubmitting}
              placeholder="API Key"
            />
            <GenericInput
              name="maxEmailsPerDay"
              control={form.control}
              containerProps={{ className: "grow" }}
              label="Max emails per day"
              type="number"
              disabled={isPending || isSubmitting}
              placeholder="100"
            />
          </div>
          <div className="flex grow flex-col space-y-2">
            <label className="text-sm font-medium mt-1">
              Today&apos;s emails sent
            </label>
            <div className="flex gap-x-8">
              <div className="flex-1">
                <Progress
                  value={emailsSentPercentage}
                  className="bg-gray-300"
                />
              </div>
              <div className="text-xs font-medium">
                {settings.emailsSentToday} / {settings?.maxEmailsPerDay || 0}{" "}
                emails
              </div>
            </div>
          </div>
          <div className="flex items-center gap-x-2 justify-end">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isPending}
            >
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
