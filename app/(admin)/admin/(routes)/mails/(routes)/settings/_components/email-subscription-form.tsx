"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { EmailSetting, EmailTemplate } from "@/generated/prisma";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailSubscriptionFormProps {
  settings: EmailSetting | null;
  templates: EmailTemplate[];
}

const formSchema = z.object({
  subscriptionTemplateId: z.string().optional(),
  freeEbookTemplateId: z.string().optional(),
  webinarTemplateId: z.string().optional(),
});

export const EmailSubscriptionForm = ({
  settings,
  templates,
}: EmailSubscriptionFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subscriptionTemplateId: settings?.subscriptionTemplateId || "",
      freeEbookTemplateId: settings?.freeEbookTemplateId || "",
      webinarTemplateId: settings?.webinarTemplateId || "",
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="webinarTemplateId"
              render={({ field }) => (
                <FormItem className="flex-auto min-w-40">
                  <FormLabel>Webinar Template</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
