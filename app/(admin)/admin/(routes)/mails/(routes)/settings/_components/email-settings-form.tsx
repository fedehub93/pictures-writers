"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { EmailProvider, EmailSetting } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface EmailSettingsFormProps {
  settings: EmailSetting | null;
  emailsSentToday: number;
}

const formSchema = z.object({
  emailSenderName: z.string(),
  emailSender: z
    .string()
    .min(1, {
      message: "Email sender required",
    })
    .email("This is not a valid email."),
  emailResponse: z
    .string()
    .min(1, {
      message: "Email receiver required",
    })
    .email("This is not a valid email."),
  emailProvider: z.custom<EmailProvider>(),
  emailApiKey: z.string().optional(),
  maxEmailsPerDay: z.coerce.number().int(),
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
      emailApiKey: "****************",
      maxEmailsPerDay: settings?.maxEmailsPerDay || 100,
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      await axios.patch(`/api/mails/settings`, {
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
    <div className="bg-slate-100 dark:bg-background p-4 w-full rounded-md">
      <h2 className="text-base text-muted-foreground">Configure your email</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="emailSenderName"
              render={({ field }) => (
                <FormItem className="min-w-40 flex-auto">
                  <FormLabel>Default sender name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading || isSubmitting}
                      placeholder="support@pictureswriters.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailSender"
              render={({ field }) => (
                <FormItem className="min-w-40 flex-auto">
                  <FormLabel>Default sender email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading || isSubmitting}
                      placeholder="support@pictureswriters.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="emailResponse"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Default response email</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading || isSubmitting}
                    placeholder="support@pictureswriters.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-wrap gap-4">
            <FormField
              name="emailProvider"
              control={form.control}
              render={({ field }) => (
                <FormItem className="min-w-40">
                  <FormLabel>Email provider</FormLabel>
                  <FormControl>
                    <Input disabled {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="emailApiKey"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel>Email API key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      disabled={isLoading || isSubmitting}
                      placeholder="API Key"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <FormField
              name="maxEmailsPerDay"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel>Max emails per day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isLoading || isSubmitting}
                      placeholder="100"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex flex-grow flex-col space-y-2">
              <label className="text-sm font-medium mt-1">
                Today&apos;s emails sent
              </label>
              <div className="flex items-center gap-x-8">
                <div className="w-full">
                  <Progress
                    value={emailsSentPercentage}
                    className="bg-gray-300"
                  />
                </div>
                <div className="text-sm font-medium">
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
