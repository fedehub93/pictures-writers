"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";

import { Settings } from "@prisma/client";

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

interface GlobalSettingsFormProps {
  settings: Settings | null;
}

const formSchema = z.object({
  siteName: z.string().min(1, {
    error: "Sitename is required",
  }),
  siteUrl: z
    .string()
    .min(1, {
      error: "Sitename is required",
    })
    .optional(),
  logoUrl: z.string().optional(),
  deployWebhookUrl: z.string().optional(),
});

export const GlobalSettingsForm = ({ settings }: GlobalSettingsFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteName: settings?.siteName || "",
      siteUrl: settings?.siteUrl || "",
      logoUrl: settings?.logoUrl || "",
      deployWebhookUrl: settings?.deployWebhookUrl || "",
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      await axios.patch(`/api/settings`, {
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
        Configure your Settings
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
          <FormField
            control={form.control}
            name="siteName"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Site Name</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading || isSubmitting}
                    placeholder="Pictures Writers"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="siteUrl"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Site URL</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading || isSubmitting}
                    placeholder="pictureswriters.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Logo Url</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading || isSubmitting}
                    placeholder="https://dominio.com/logo.png"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deployWebhookUrl"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Deploy Webhook Url</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading || isSubmitting}
                    placeholder="https://api.webhook..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-x-2 justify-start">
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
