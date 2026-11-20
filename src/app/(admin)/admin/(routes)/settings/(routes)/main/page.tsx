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
import {
  MEDIA_QUOTA_DEFAULT_MB,
  PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
  parseMediaQuotaMb,
  parsePublicOriginReserveMb,
} from "@/modules/media/lib/quota";

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
  mediaQuotaMb: z
    .string()
    .min(1, { error: "Media quota is required" })
    .refine((value) => parseMediaQuotaMb(value) !== null, {
      error: "Media quota must be a whole number of megabytes, at least 1",
    }),
  publicOriginReserveMb: z
    .string()
    .min(1, { error: "Public-origin reserve is required" })
    .refine((value) => parsePublicOriginReserveMb(value) !== null, {
      error: "Public-origin reserve must be a whole number of megabytes, zero or more",
    }),
}).superRefine((values, context) => {
  const quotaMb = parseMediaQuotaMb(values.mediaQuotaMb);
  const reserveMb = parsePublicOriginReserveMb(values.publicOriginReserveMb);

  if (quotaMb !== null && reserveMb !== null && reserveMb > quotaMb) {
    context.addIssue({
      code: "custom",
      path: ["publicOriginReserveMb"],
      message: "The reserve is held inside the quota, so it cannot exceed it",
    });
  }
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
      mediaQuotaMb: String(settings?.mediaQuotaMb ?? MEDIA_QUOTA_DEFAULT_MB),
      publicOriginReserveMb: String(
        settings?.publicOriginReserveMb ?? PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
      ),
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      await axios.patch(`/api/settings`, {
        ...values,
        mediaQuotaMb:
          parseMediaQuotaMb(values.mediaQuotaMb) ?? MEDIA_QUOTA_DEFAULT_MB,
        publicOriginReserveMb:
          parsePublicOriginReserveMb(values.publicOriginReserveMb) ??
          PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
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
          <FormField
            control={form.control}
            name="mediaQuotaMb"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Media quota (MB)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    disabled={isLoading || isSubmitting}
                    placeholder={String(MEDIA_QUOTA_DEFAULT_MB)}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Maximum total size of every stored file: originals plus
                  generated renditions, attachments, avatars and archived
                  media included. Uploads that would go past it are refused.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="publicOriginReserveMb"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Public upload reserve (MB)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    disabled={isLoading || isSubmitting}
                    placeholder={String(PUBLIC_ORIGIN_RESERVE_DEFAULT_MB)}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  How much of the quota files uploaded by visitors may occupy.
                  Public uploads are refused past this reserve while your own
                  uploads keep working; zero refuses every public upload.
                  Default: {PUBLIC_ORIGIN_RESERVE_DEFAULT_MB} MB.
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
