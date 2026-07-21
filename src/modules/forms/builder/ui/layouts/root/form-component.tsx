"use client";

import type { Route } from "next";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendGTMEvent } from "@next/third-parties/google";

import type { FormActionResponse } from "@/actions/submit-form";

import type { FormRootInstance } from "../../../types/core";

import { FormNodeRenderer } from "../../../runner/form-node-renderer";
import { generateFormSchema } from "../../../lib/generate-form-schema";
import { generateDefaultValues } from "../../../lib/generate-default-values";

export function RootFormComponent({
  id,
  elementInstance,
  onSubmitHandler,
  gtmEventName,
}: {
  id: string;
  elementInstance: FormRootInstance;
  onSubmitHandler: (values: Record<string, any>) => Promise<FormActionResponse>;
  gtmEventName: string | null;
}) {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const { submission } = elementInstance.properties;

  const dynamicSchema = generateFormSchema(elementInstance);
  const defaultValues = generateDefaultValues(elementInstance);

  const methods = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: { ...defaultValues },
  });

  const onSubmit = async (values: Record<string, any>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        // Deleghiamo tutta la logica di business al parent
        const result = await onSubmitHandler(values);

        if (!result.success) {
          setError(result.message);
        } else {
          const emailDomain =
            typeof values.email === "string" && values.email.includes("@")
              ? values.email.split("@")[1]
              : "unknown";

          sendGTMEvent({
            event: gtmEventName,
            form_type: "form_submission",
            form_location: "*",
            page_path: window.location.pathname,
            page_title: document.title,
            email_domain: emailDomain,
          });
          setSuccess(result.message);

          if (submission.onSuccess.type === "toast") {
            toast.success(submission.onSuccess.successMessage);
          } else if (submission.onSuccess.type === "redirect") {
            router.push(submission.onSuccess.url as Route);
          }
        }
      } catch (err) {
        setError(
          "Qualcosa è andato storto. Prego riprovare o contattare il supporto.",
        );
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="w-full gap-y-4 flex flex-col"
      >
        {elementInstance.children.map((node) => (
          <FormNodeRenderer key={node.id} node={node} />
        ))}

        {error && <div className="p-4 mb-4 bg-accent rounded">{error}</div>}
        {success && (
          <div className="p-4 mb-4 bg-primary text-primary-foreground shadow-2xs rounded">
            {success}
          </div>
        )}
      </form>
    </FormProvider>
  );
}
