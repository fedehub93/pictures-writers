"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";

import { Seo } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface SeoSettingsFormProps {
  seo: Seo | null;
}

const formSchema = z.object({
  title: z
    .string()
    .min(1, {
      message: "SEO Title required",
    })
    .optional(),
  description: z
    .string()
    .min(1, {
      message: "SEO Description required",
    })
    .optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
});

export const SeoSettingsForm = ({ seo }: SeoSettingsFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: seo?.title || "",
      description: seo?.description || "",
      noIndex: seo?.noIndex || false,
      noFollow: seo?.noFollow || false,
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      await axios.patch(`/api/settings/seo`, {
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
      <h2 className="text-base text-muted-foreground">Configure your SEO</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Title</FormLabel>
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
            name="description"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isLoading || isSubmitting}
                    placeholder="Pictures Writers è una piattaforma..."
                    className="resize"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="noIndex"
            render={({ field }) => (
              <FormItem className="flex flex-row bg-white dark:bg-slate-900 items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">No Index</FormLabel>
                  <FormDescription>
                    Prevent all search engines that support the noindex rule
                    from indexing this page.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    disabled={isSubmitting || isLoading}
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="noFollow"
            render={({ field }) => (
              <FormItem className="flex flex-row bg-white dark:bg-slate-900 items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">No Follow</FormLabel>
                  <FormDescription>
                    Prevent all search engines that support the noFollow rule
                    from follow the links on this page.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    disabled={isSubmitting || isLoading}
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
