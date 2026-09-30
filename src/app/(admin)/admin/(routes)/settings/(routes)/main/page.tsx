"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useSettings } from "../../_components/providers/settings-provider";
import { Separator } from "@/shared/ui/separator";

/// A curated set of common IANA zones; add more as needed.
const SITE_TIME_ZONES = [
  "UTC",
  "Europe/Rome",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

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
  timezone: z.string().optional(),
});

const MainSettingsPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteName: settings?.siteName || "",
      siteUrl: settings?.siteUrl || "",
      logoUrl: settings?.logoUrl || "",
      deployWebhookUrl: settings?.deployWebhookUrl || "",
      timezone: settings?.timezone || "Europe/Rome",
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
    <div className="p-4 w-full rounded-md flex flex-col gap-y-8">
      <div className="flex flex-col flex-1">
        <h3 className="text-lg font-bold space-y-0.5">General</h3>
        <p className="text-muted-foreground text-sm">
          Update your general settings. Set your site name and url.
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Time zone</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading || isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="UTC" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SITE_TIME_ZONES.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Automations schedule in this time zone (cron triggers and Wait
                  time-of-day).
                </FormDescription>
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

export default MainSettingsPage;
