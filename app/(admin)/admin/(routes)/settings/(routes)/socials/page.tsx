"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { SocialIcon } from "react-social-icons";

import { SocialKey } from "@prisma/client";

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
import { Separator } from "@/components/ui/separator";
import { useSettings } from "../../_components/providers/settings-provider";
import { DEFAULT_SOCIAL_CHANNEL_VALUES } from "@/data/settings";
import { getFirstCharUppercase } from "@/lib/utils";

const SocialKeyZ = z.enum([
  SocialKey.FACEBOOK,
  SocialKey.INSTAGRAM,
  SocialKey.LINKEDIN,
  SocialKey.TWITTER,
  SocialKey.PINTEREST,
  SocialKey.YOUTUBE,
]);

const formSchema = z.object({
  socials: z.array(
    z.object({
      key: SocialKeyZ,
      url: z
        .string()
        .optional()
        .refine(
          (value) => !value || /^https?:\/\/[^\s$.?#].[^\s]*$/.test(value),
          { error: "Deve essere un URL valido" }
        ),
    })
  ),
});

const SocialSettingsPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();
  const socials = settings?.socials;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      socials: socials
        ? socials.map((s) => ({ key: s.key, url: s.url || "" }))
        : DEFAULT_SOCIAL_CHANNEL_VALUES,
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const { fields } = useFieldArray({
    control: form.control,
    name: "socials", // Nome dell'array nel form
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/settings/socials`, {
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
        <h3 className="text-lg font-bold space-y-0.5">Social channels</h3>
        <p className="text-muted-foreground text-sm">
          Update your general social channels settings.
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {fields.map((field, index) => (
            <div
              key={field.key}
              className="flex flex-wrap gap-x-4 items-center"
            >
              <div className="self-end">
                <SocialIcon
                  network={field.key.toLowerCase()}
                  style={{ height: 45, width: 45 }}
                />
              </div>

              <FormField
                control={form.control}
                name={`socials.${index}.url`}
                render={({ field: fieldUrl }) => (
                  <FormItem className="min-w-40 flex-auto">
                    <FormLabel>
                      {getFirstCharUppercase(field.key)} Url
                    </FormLabel>
                    <FormControl>
                      <Input {...fieldUrl} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

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

export default SocialSettingsPage;
