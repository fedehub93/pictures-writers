"use client";

import { useForm } from "react-hook-form";
import { useMemo, useState, useTransition } from "react";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import toast from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { sendGTMEvent } from "@next/third-parties/google";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericTextarea } from "@/components/form-component/generic-textarea";

import { FileUploadButton } from "@/components/file-upload-button";
import { submitProductForm } from "@/actions/submit-product-form";
import { GoogleRecaptchaV3 } from "@/components/google-recaptchav3";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";

interface SubmissionFormProps {
  rootId: string;
  form: {
    id: string;
    name: string;
    fields: string;
    submitLabel: string | null;
    gtmEventName: string | null;
  };
}

export default function SubmissionForm({
  rootId,
  form: formDef,
}: SubmissionFormProps) {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

  const jsonFields = JSON.parse(formDef.fields as string);

  const schema = v.record(v.string(), v.any());

  // 👇 Crea defaultValues dinamicamente
  const defaultValues = useMemo(() => {
    const values: Record<string, any> = {};
    for (const field of jsonFields) {
      switch (field.type) {
        case "file":
          values[field.name] = []; // array vuoto
          break;
        case "checkbox":
          values[field.name] = false;
          break;
        default:
          values[field.name] = "";
      }
    }
    return values;
  }, [jsonFields]);

  const form = useForm({
    resolver: valibotResolver(schema),
    mode: "all",
    defaultValues,
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: any) => {
    try {
      setError("");
      setSuccess("");

      startTransition(async () => {
        // Execute reCAPTCHA first
        setIsRecaptchaLoading(true);
        const recaptchaToken = await getCaptchaToken("submit_product_form");
        setIsRecaptchaLoading(false);

        if (!recaptchaToken) {
          toast.error("Security verification failed. Please try again.");
          return;
        }

        submitProductForm(rootId, values, recaptchaToken).then((data) => {
          if (!data.success) {
            setError(data.message);
            setSuccess("");
          }

          if (data.success && typeof window !== "undefined") {
            setError("");
            setSuccess(data.message);
            if (!!formDef.gtmEventName) {
              sendGTMEvent({
                event: formDef.gtmEventName,
                form_type: "form_submission",
                form_location: "product_page",
                page_path: window.location.pathname,
                page_title: document.title,
                email_domain: values.email.split("@")[1],
              });
            }
          }
        });
      });
    } catch (error) {
      setIsRecaptchaLoading(false);
      setError(
        "Qualcosa è andato storto. Prego riprovare o contattare il supporto."
      );
      setSuccess("");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-y-4">
      <div className="text-2xl font-semibold">Informazioni sottoscrizione</div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-card border rounded-lg shadow-lg p-4 flex flex-col space-y-4"
        >
          {jsonFields.map((field: any) => {
            switch (field.type) {
              case "text":
                return (
                  <GenericInput
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    label={field.label}
                    placeholder={field.placeholder || ""}
                    disabled={isSubmitting}
                    className="w-full disabled:bg-muted"
                    labelProps={{ className: "text-lg" }}
                  />
                );
              case "textarea":
                return (
                  <GenericTextarea
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    label={field.label}
                    placeholder={field.placeholder || ""}
                    className="py-4 w-full h-20 disabled:bg-muted"
                    labelProps={{ className: "text-lg" }}
                    disabled={isSubmitting}
                  />
                );
              case "checkbox":
                return (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: f }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={f.value || false}
                            onCheckedChange={(checked) => f.onChange(checked)}
                            disabled={isSubmitting}
                            className="size-5 accent-primary"
                            required={field.required}
                          />
                        </FormControl>
                        <div className="space-y-1 self-center leading-none text-sm">
                          <FormLabel
                            dangerouslySetInnerHTML={{ __html: field.label }}
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                );
              case "file":
                return (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-lg">{field.label}</FormLabel>
                        <FormControl>
                          <FileUploadButton
                            endpoint="submissionAttachments"
                            size="small"
                            value={f.value as any[]}
                            onChange={(files: any[]) => f.onChange(files)}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                );
              default:
                return null;
            }
          })}

          <GoogleRecaptchaV3 />

          {error && <div className="p-4 mb-4 bg-accent rounded">{error}</div>}
          {success && (
            <div className="p-4 mb-4 bg-primary text-primary-foreground shadow-2xs rounded">
              {success}
            </div>
          )}
          {isPending || isRecaptchaLoading ? (
            <>
              <BeatLoader />
              {isRecaptchaLoading ? "Verifica..." : "Invio..."}
            </>
          ) : !success ? (
            <Button
              type="submit"
              disabled={isSubmitting || isRecaptchaLoading}
              className="bg-primary"
            >
              {formDef.submitLabel || "Invia"}
            </Button>
          ) : null}
        </form>
      </Form>
    </div>
  );
}
