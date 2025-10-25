"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericTextarea } from "@/components/form-component/generic-textarea";

import { projectFormSchema, ProjectFormValues } from "@/schemas/submission";
import { FileUploadButton } from "@/components/file-upload-button";

// 🔧 funzione per costruire schema Zod dinamico
function buildZodSchema(fields: any[]) {
  const shape: Record<string, any> = {};

  for (const field of fields) {
    switch (field.type) {
      case "text":
      case "textarea":
        shape[field.name] = field.required
          ? z.string().min(1, `${field.label} obbligatorio`)
          : z.string().optional();
        break;
      case "file":
        shape[field.name] = field.required
          ? z.object({
              key: z.string().min(1),
              name: z.string(),
              url: z.url().optional(),
              size: z.number().optional(),
              type: z.string().optional(),
            })
          : z.any().optional();
        break;
      default:
        shape[field.name] = z.any().optional();
    }
  }

  return z.object(shape);
}

interface SubmissionFormProps {
  rootId: string;
  form: {
    id: string;
    name: string;
    fields: string;
  };
}

export default function SubmissionForm({
  rootId,
  form: formDef,
}: SubmissionFormProps) {
  const [submissionJustSent, setSubmissionJustSent] = useState(false);

  const jsonFields = JSON.parse(formDef.fields as string);

  const schema = useMemo(() => buildZodSchema(jsonFields), [formDef.fields]);

  // 👇 Crea defaultValues dinamicamente
  const defaultValues = useMemo(() => {
    const values: Record<string, any> = {};
    for (const field of jsonFields) {
      switch (field.type) {
        case "file":
          values[field.name] = null; // oppure {} se usi un oggetto file
          break;
        default:
          values[field.name] = "";
      }
    }
    return values;
  }, [jsonFields]);

  const form = useForm({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues,
  });

  const { isSubmitting } = form.formState;
  const onSubmit = async (values: any) => {
    try {
      // Invio lato client: puoi chiamare direttamente un'API o un'azione server
      const res = await fetch(`/api/products/${rootId}/submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Errore invio form");

      setSubmissionJustSent(true);
    } catch (err) {
      console.error("Errore durante l'invio:", err);
    }
  };

  if (submissionJustSent) {
    // return <AlertSubmissionSent contestId={contestId} />;
  }

  return (
    <div className="flex-1 flex flex-col gap-y-4 ">
      <div className="text-2xl font-semibold">Informazioni sottoscrizione</div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-card border rounded-lg shadow-lg p-4 w-full mx-auto h-full flex flex-col space-y-4"
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
                            value={f.value as any}
                            onChange={(file) => f.onChange(file)}
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
          <Button type="submit">Invia</Button>
        </form>
      </Form>
    </div>
  );
}
