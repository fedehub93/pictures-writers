"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { settingsTesterSchema, SettingsTesterValues } from "../../schemas";
import { SettingsGet } from "../../types";

interface EmailTesterFormProps {
  settings: SettingsGet;
}

export const EmailTesterForm = ({ settings }: EmailTesterFormProps) => {
  const trpc = useTRPC();

  const form = useForm<SettingsTesterValues>({
    resolver: zodResolver(settingsTesterSchema),
    defaultValues: {
      emailRecipient: "",
      emailTemplateId: "",
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const testSettings = useMutation(
    trpc.mailSettings.test.mutationOptions({
      onSuccess: async () => {
        toast.success("Test email sent successfully!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = async (values: SettingsTesterValues) => {
    testSettings.mutate(values);
  };

  const isPending = testSettings.isPending;

  return (
    <div className="border p-4 w-full rounded flex flex-col">
      <h2 className="text-base text-muted-foreground">Test email</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="emailRecipient"
              render={({ field }) => (
                <FormItem className="flex-auto min-w-40">
                  <FormLabel>Email recipient</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
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
              name="emailTemplateId"
              render={({ field }) => (
                <FormItem className="flex-auto min-w-40">
                  <FormLabel>Template</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue="">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an email template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {settings.templates.map((template) => (
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
            <Button type="submit" disabled={isPending || !isValid}>
              Send Email
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
