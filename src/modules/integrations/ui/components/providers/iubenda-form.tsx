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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  IUBENDA_LANGS,
  iubendaConfigSchema,
  type IubendaConfig,
} from "@/modules/integrations/lib/providers/iubenda-config";
import type { IntegrationProviderFormProps } from "@/modules/integrations/lib/providers/types";

type IubendaFormValues = z.input<typeof iubendaConfigSchema>;

const isIubendaLang = (
  value: unknown,
): value is IubendaConfig["lang"] =>
  IUBENDA_LANGS.includes(value as IubendaConfig["lang"]);

const toFormValues = (config: Record<string, unknown>): IubendaConfig => ({
  siteId: typeof config.siteId === "string" ? config.siteId : "",
  cookiePolicyId:
    typeof config.cookiePolicyId === "string" ? config.cookiePolicyId : "",
  lang: isIubendaLang(config.lang) ? config.lang : "it",
  autoblocking:
    typeof config.autoblocking === "boolean" ? config.autoblocking : true,
  consentMode:
    typeof config.consentMode === "boolean" ? config.consentMode : true,
});

export const IubendaIntegrationForm = ({
  open,
  onOpenChange,
  providerName,
  config,
  onSubmit,
  isPending,
}: IntegrationProviderFormProps) => {
  const form = useForm<IubendaFormValues>({
    resolver: zodResolver(iubendaConfigSchema),
    defaultValues: toFormValues(config),
  });

  const lang = useWatch({ control: form.control, name: "lang" });
  const autoblocking = useWatch({
    control: form.control,
    name: "autoblocking",
  });
  const consentMode = useWatch({ control: form.control, name: "consentMode" });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(config));
    }
  }, [open, config, form]);

  return (
    <ResponsiveDialog
      title={`Configure ${providerName}`}
      description="Enter the identifiers from your Iubenda Privacy Controls and Cookie Solution dashboard."
      open={open}
      onOpenChange={onOpenChange}
    >
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({ config: { ...iubendaConfigSchema.parse(values) } }),
        )}
        className="flex flex-col gap-6"
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="iubenda-site-id">Site ID</FieldLabel>
            <Input
              id="iubenda-site-id"
              inputMode="numeric"
              placeholder="e.g. 3303495"
              disabled={isPending}
              {...form.register("siteId")}
            />
            <FieldDescription>
              The numeric site ID shown in the Iubenda embed snippet.
            </FieldDescription>
            <FieldError
              errors={
                form.formState.errors.siteId
                  ? [{ message: form.formState.errors.siteId.message }]
                  : undefined
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="iubenda-cookie-policy-id">
              Cookie policy ID
            </FieldLabel>
            <Input
              id="iubenda-cookie-policy-id"
              inputMode="numeric"
              placeholder="e.g. 123456"
              disabled={isPending}
              {...form.register("cookiePolicyId")}
            />
            <FieldDescription>
              The numeric cookie policy ID shown in the same snippet.
            </FieldDescription>
            <FieldError
              errors={
                form.formState.errors.cookiePolicyId
                  ? [
                      {
                        message:
                          form.formState.errors.cookiePolicyId.message,
                      },
                    ]
                  : undefined
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="iubenda-lang">Language</FieldLabel>
            <Select
              value={lang}
              onValueChange={(value) =>
                form.setValue("lang", value as IubendaConfig["lang"])
              }
              disabled={isPending}
            >
              <SelectTrigger id="iubenda-lang" className="w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {IUBENDA_LANGS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Language of the consent banner on the public site.
            </FieldDescription>
            <FieldError
              errors={
                form.formState.errors.lang
                  ? [{ message: form.formState.errors.lang.message }]
                  : undefined
              }
            />
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id="iubenda-autoblocking"
              checked={autoblocking}
              onCheckedChange={(checked) =>
                form.setValue("autoblocking", checked === true)
              }
              disabled={isPending}
            />
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="iubenda-autoblocking">
                Use autoblocking
              </FieldLabel>
              <FieldDescription>
                Recommended. Turn off to use the sync loader instead.
              </FieldDescription>
            </div>
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id="iubenda-consent-mode"
              checked={consentMode}
              onCheckedChange={(checked) =>
                form.setValue("consentMode", checked === true)
              }
              disabled={isPending}
            />
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="iubenda-consent-mode">
                Use the Iubenda GTM template for Consent Mode
              </FieldLabel>
              <FieldDescription>
                {consentMode
                  ? "Keep the iubenda Privacy Controls and Cookie Solution tag active in GTM: it sets default consent to denied and applies the banner's updates."
                  : "No consent signals are managed by Iubenda. Pause the Iubenda template in GTM as well."}
              </FieldDescription>
            </div>
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
