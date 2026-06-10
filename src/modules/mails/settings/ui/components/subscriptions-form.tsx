"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Suspense } from "react";

import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

import { settingsUpdateSchema, SettingsUpdateValues } from "../../schemas";
import { SettingsGet } from "../../types";
import { useSuspenseTemplates } from "@/modules/mails/templates";

interface EmailSubscriptionFormProps {
  settings: SettingsGet;
}

const EmailSubscriptionFormContent = ({
  settings,
}: EmailSubscriptionFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: templates } = useSuspenseTemplates();

  const form = useForm<SettingsUpdateValues>({
    resolver: zodResolver(settingsUpdateSchema),
    defaultValues: {
      id: settings.id,
      subscriptionTemplateId: settings.subscriptionTemplateId ?? null,
      freeEbookTemplateId: settings.freeEbookTemplateId ?? null,
      webinarTemplateId: settings.webinarTemplateId ?? null,
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const updateSettings = useMutation(
    trpc.mailSettings.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.mailSettings.get.queryOptions(),
        );
        toast.success("Subscriptions updated successfully!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = async (values: SettingsUpdateValues) => {
    updateSettings.mutate(values);
  };

  return (
    <div className="border p-4 w-full rounded">
      <h2 className="text-base text-muted-foreground">
        Configure your subscription
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="subscriptionTemplateId"
              render={({ field }) => (
                <FormItem className="flex-auto min-w-40">
                  <FormLabel>Subscription Template</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) =>
                      field.onChange(value === "" ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an email template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="freeEbookTemplateId"
              render={({ field }) => (
                <FormItem className="flex-auto min-w-40">
                  <FormLabel>Free Ebook Template</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) =>
                      field.onChange(value === "" ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an email template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="webinarTemplateId"
              render={({ field }) => (
                <FormItem className="flex-auto min-w-40">
                  <FormLabel>Webinar Template</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) =>
                      field.onChange(value === "" ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an email template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-x-2 justify-end">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || updateSettings.isPending}
            >
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const EmailSubscriptionForm = ({
  settings,
}: EmailSubscriptionFormProps) => {
  return (
    <Suspense fallback={<Skeleton className="w-full h-64" />}>
      <EmailSubscriptionFormContent settings={settings} />
    </Suspense>
  );
};
