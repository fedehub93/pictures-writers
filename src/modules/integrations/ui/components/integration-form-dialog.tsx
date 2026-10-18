"use client";

import "client-only";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";

const formSchema = z
  .object({
    apiKey: z.string().optional(),
    removeApiKey: z.boolean().optional(),
    webhookSecret: z.string().optional(),
    removeWebhookSecret: z.boolean().optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine(
    (data) => !(data.removeApiKey && data.apiKey),
    {
      message: "Cannot remove and replace the API key at the same time.",
      path: ["apiKey"],
    },
  )
  .refine(
    (data) => !(data.removeWebhookSecret && data.webhookSecret),
    {
      message: "Cannot remove and replace the webhook secret at the same time.",
      path: ["webhookSecret"],
    },
  );

export type IntegrationFormValues = z.infer<typeof formSchema>;

interface IntegrationFormDialogProps {
  provider: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultIsEnabled: boolean;
  onSubmit: (values: IntegrationFormValues) => void;
  isPending?: boolean;
}

export const IntegrationFormDialog = ({
  provider,
  open,
  onOpenChange,
  defaultIsEnabled,
  onSubmit,
  isPending,
}: IntegrationFormDialogProps) => {
  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      removeApiKey: false,
      webhookSecret: "",
      removeWebhookSecret: false,
      isEnabled: defaultIsEnabled,
    },
  });

  const removeApiKey = useWatch({ control: form.control, name: "removeApiKey" });
  const removeWebhookSecret = useWatch({
    control: form.control,
    name: "removeWebhookSecret",
  });
  const isEnabled = useWatch({ control: form.control, name: "isEnabled" });

  useEffect(() => {
    if (open) {
      form.reset({
        apiKey: "",
        removeApiKey: false,
        webhookSecret: "",
        removeWebhookSecret: false,
        isEnabled: defaultIsEnabled,
      });
    }
  }, [open, defaultIsEnabled, form]);

  return (
    <ResponsiveDialog
      title={`Edit ${provider} integration`}
      description="Credentials are write-only. Leave a field empty to keep the current value, or check Remove to delete it."
      open={open}
      onOpenChange={onOpenChange}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="apiKey">API key</FieldLabel>
            <Input
              id="apiKey"
              type="password"
              placeholder="Leave empty to keep current"
              disabled={isPending || removeApiKey}
              {...form.register("apiKey")}
            />
            <FieldDescription>
              The API key is never shown after it is saved.
            </FieldDescription>
            <FieldError errors={form.formState.errors.apiKey ? [{ message: form.formState.errors.apiKey.message }] : undefined} />
          </Field>
          <Field orientation="horizontal">
            <Checkbox
              id="removeApiKey"
              checked={removeApiKey}
              onCheckedChange={(checked) =>
                form.setValue("removeApiKey", checked === true)
              }
              disabled={isPending}
            />
            <FieldLabel htmlFor="removeApiKey">Remove API key</FieldLabel>
          </Field>

          <Field>
            <FieldLabel htmlFor="webhookSecret">Webhook secret</FieldLabel>
            <Input
              id="webhookSecret"
              type="password"
              placeholder="Leave empty to keep current"
              disabled={isPending || removeWebhookSecret}
              {...form.register("webhookSecret")}
            />
            <FieldDescription>
              Required only if you receive inbound email webhooks from Resend.
            </FieldDescription>
            <FieldError errors={form.formState.errors.webhookSecret ? [{ message: form.formState.errors.webhookSecret.message }] : undefined} />
          </Field>
          <Field orientation="horizontal">
            <Checkbox
              id="removeWebhookSecret"
              checked={removeWebhookSecret}
              onCheckedChange={(checked) =>
                form.setValue("removeWebhookSecret", checked === true)
              }
              disabled={isPending}
            />
            <FieldLabel htmlFor="removeWebhookSecret">
              Remove webhook secret
            </FieldLabel>
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id="isEnabled"
              checked={isEnabled}
              onCheckedChange={(checked) =>
                form.setValue("isEnabled", checked === true)
              }
              disabled={isPending}
            />
            <FieldLabel htmlFor="isEnabled">Enabled</FieldLabel>
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
