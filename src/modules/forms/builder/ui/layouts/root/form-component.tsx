"use client";

import type { Route } from "next";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";
import { submitForm } from "@/actions/submit-form";
import { sendGTMEvent } from "@next/third-parties/google";

import type { FormRootInstance } from "../../../types/core";

import { FormNodeRenderer } from "../../../runner/form-node-renderer";
import { generateFormSchema } from "../../../lib/generate-form-schema";
import { generateDefaultValues } from "../../../lib/generate-default-values";

export function RootFormComponent({
  id,
  gtmEventName,
  elementInstance,
}: {
  id: string;
  gtmEventName: string | null;
  elementInstance: FormRootInstance;
}) {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

  const router = useRouter();
  const { submission } = elementInstance.properties;

  const dynamicSchema = generateFormSchema(elementInstance);
  const defaultValues = generateDefaultValues(elementInstance);

  const methods = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: { ...defaultValues },
  });

  const onSubmit = async (values: Record<string, any>) => {
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

        submitForm(id, values, recaptchaToken).then((data) => {
          if (!data.success) {
            setError(data.message);
            setSuccess("");
          }

          if (data.success && typeof window !== "undefined") {
            setError("");
            setSuccess(data.message);
            if (!!gtmEventName) {
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
            }

            const { onSuccess } = submission;

            switch (onSuccess.type) {
              case "toast":
                toast.success(onSuccess.successMessage);
                break;

              case "redirect":
                router.push(onSuccess.url as Route);
                break;
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
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="w-full gap-y-4 flex flex-col"
      >
        {elementInstance.children.map((node) => (
          <FormNodeRenderer key={node.id} node={node} />
        ))}
      </form>
    </FormProvider>
  );
}
