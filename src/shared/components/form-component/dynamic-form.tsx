"use client";

import { useForm } from "react-hook-form";
import { useMemo, useState, useTransition } from "react";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { BeatLoader } from "react-spinners";
import { sendGTMEvent } from "@next/third-parties/google";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericTextarea } from "@/shared/components/form-component/generic-textarea";

import { FileUploadButton } from "@/shared/components/file-upload-button";
import { GoogleRecaptchaV3 } from "@/shared/components/google-recaptchav3";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";
import { submitForm } from "@/actions/submit-form";

interface DynamicFormProps {
  form: {
    id: string;
    name: string;
    fields: string;
    submitLabel: string | null;
    gtmEventName: string | null;
  };
  title?: string;
}

export default function DynamicForm({
  form: formDef,
  title,
}: DynamicFormProps) {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

  let jsonFields;
  try {
    jsonFields = JSON.parse(formDef.fields as string);
  } catch (error) {
    console.error("Invalid form fields JSON:", error);
    return <div className="text-destructive">Invalid form configuration</div>;
  }
  const schema = useMemo(() => {
    const shape: Record<string, any> = {};

    for (const field of jsonFields) {
      let validator: any = v.string();

      // 🔹 Gestisci i tipi base
      switch (field.type) {
        case "text":
        case "textarea":
          validator = v.pipe(v.string());
          if (field.required)
            validator = v.pipe(
              validator,
              v.minLength(1, `${field.label} è obbligatorio`),
            );
          break;

        case "email":
          validator = v.pipe(
            v.string(),
            v.email(`${field.label || "Email"} non è valida`),
          );
          if (field.required) validator = v.pipe(validator, v.minLength(1));
          break;

        case "checkbox":
          validator = field.required
            ? v.literal(true, `${field.label} deve essere accettato`)
            : v.boolean();
          break;

        case "file":
          validator = field.required
            ? v.array(v.any(), `${field.label} è obbligatorio`)
            : v.optional(v.array(v.any()));
          break;

        default:
          validator = v.any();
      }

      shape[field.name] = validator;
    }

    return v.object(shape);
  }, [jsonFields]);

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

  const onSubmit = async (values: Record<string, string>) => {
    try {
      setError("");
      setSuccess("");

      startTransition(async () => {
        // Execute reCAPTCHA first
        setIsRecaptchaLoading(true);
        const recaptchaToken = await getCaptchaToken("submit_form");
        setIsRecaptchaLoading(false);

        if (!recaptchaToken) {
          toast.error("Security verification failed. Please try again.");
          return;
        }

        submitForm(formDef.id, values, recaptchaToken).then((data) => {
          if (!data.success) {
            setError(data.message);
            setSuccess("");
          }

          if (data.success && typeof window !== "undefined") {
            setError("");
            setSuccess(data.message);
            if (!!formDef.gtmEventName) {
              const emailDomain =
                typeof values.email === "string" && values.email.includes("@")
                  ? values.email.split("@")[1]
                  : "unknown";
              sendGTMEvent({
                event: formDef.gtmEventName,
                form_type: "form_submission",
                form_location: "*",
                page_path: window.location.pathname,
                page_title: document.title,
                email_domain: emailDomain,
              });
            }
          }
        });
      });
    } catch (error) {
      setIsRecaptchaLoading(false);
      setError(
        "Qualcosa è andato storto. Prego riprovare o contattare il supporto.",
      );
      setSuccess("");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-y-4">
      {title && <div className="text-2xl font-semibold">{title}</div>}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-card rounded-lg flex flex-col space-y-4"
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
