"use client";

import "client-only";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import {
  gtmConfigSchema,
  type GtmConfig,
} from "@/modules/integrations/lib/providers/gtm-config";
import type { IntegrationProviderFormProps } from "@/modules/integrations/lib/providers/types";

type GtmFormValues = z.input<typeof gtmConfigSchema>;

const toFormValues = (config: Record<string, unknown>): GtmConfig => ({
  containerId:
    typeof config.containerId === "string" ? config.containerId : "",
});

export const GtmIntegrationForm = ({
  open,
  onOpenChange,
  providerName,
  config,
  onSubmit,
  isPending,
}: IntegrationProviderFormProps) => {
  const form = useForm<GtmFormValues>({
    resolver: zodResolver(gtmConfigSchema),
    defaultValues: toFormValues(config),
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(config));
    }
  }, [open, config, form]);

  return (
    <ResponsiveDialog
      title={`Configure ${providerName}`}
      description="Enter the container id that should load on the public site."
      open={open}
      onOpenChange={onOpenChange}
    >
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({ config: { ...gtmConfigSchema.parse(values) } }),
        )}
        className="flex flex-col gap-6"
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="gtm-container-id">Container ID</FieldLabel>
            <Input
              id="gtm-container-id"
              placeholder="GTM-XXXXXXX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              disabled={isPending}
              {...form.register("containerId")}
            />
            <FieldDescription>
              Found in Google Tag Manager under Admin → Container → Install
              Google Tag Manager, as the GTM-… id inside the snippet. Paste the
              id only, not the snippet.
            </FieldDescription>
            <FieldError
              errors={
                form.formState.errors.containerId
                  ? [{ message: form.formState.errors.containerId.message }]
                  : undefined
              }
            />
          </Field>
        </FieldGroup>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
};
