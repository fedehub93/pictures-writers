"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { EmailProvider, EmailSetting } from "@/generated/prisma";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { GenericSelect } from "@/components/form-component/generic-select";
import { GenericInput } from "@/components/form-component/generic-input";

interface EmailSettingsFormProps {
  settings: EmailSetting | null;
  emailsSentToday: number;
}

const formSchema = z.object({
  emailSenderName: z.string(),
  emailSender: z.email().min(1, {
    error: "Email sender required",
  }),
  emailResponse: z.email().min(1, {
    error: "Email receiver required",
  }),

  emailProvider: z.custom<EmailProvider>(),
  emailApiKey: z.string().optional(),
  maxEmailsPerDay: z.coerce.number<number>().int(),
});

export const EmailSettingsForm = ({
  settings,
  emailsSentToday,
}: EmailSettingsFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const emailsSentPercentage =
    (emailsSentToday / (settings?.maxEmailsPerDay || 0)) * 100;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailSenderName: settings?.emailSenderName || "",
      emailSender: settings?.emailSender || "",
      emailResponse: settings?.emailResponse || "",
      emailProvider: settings?.emailProvider || EmailProvider.SENDGRID,
      emailApiKey: process.env.NEXT_SENDGRID_KEY,
      maxEmailsPerDay: settings?.maxEmailsPerDay || 100,
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      await axios.patch(`/api/admin/mails/settings`, {
        ...values,
      });

      toast.success("Settings updated successfully");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };
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
              disabled={isLoading || isSubmitting}
              placeholder="support@pictureswriters.com"
            />

            <GenericInput
              name="emailSender"
              control={form.control}
              containerProps={{ className: "min-w-40 flex-auto" }}
              label="Default sender email"
              disabled={isLoading || isSubmitting}
              placeholder="support@mail.pictureswriters.com"
            />
          </div>

          <GenericInput
            name="emailResponse"
            control={form.control}
            containerProps={{ className: "min-w-40 flex-auto" }}
            label="Default response email"
            disabled={isLoading || isSubmitting}
            placeholder="support@pictureswriters.com"
          />
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
              disabled={isLoading || isSubmitting}
              placeholder="API Key"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <GenericInput
              name="maxEmailsPerDay"
              control={form.control}
              containerProps={{ className: "grow" }}
              label="Max emails per day"
              type="number"
              disabled={isLoading || isSubmitting}
              placeholder="100"
            />
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
                  {emailsSentToday} / {settings?.maxEmailsPerDay || 0} emails
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-x-2 justify-end">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isLoading}
            >
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
