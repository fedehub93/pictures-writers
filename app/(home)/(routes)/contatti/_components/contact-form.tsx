"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { BeatLoader } from "react-spinners";
import { sendGTMEvent } from "@next/third-parties/google";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { ContactSchemaValibot } from "@/schemas";
import { contact } from "@/actions/contact";

import { GoogleRecaptchaV3 } from "@/components/google-recaptchav3";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericTextarea } from "@/components/form-component/generic-textarea";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

export const ContactForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

  const form = useForm<v.InferInput<typeof ContactSchemaValibot>>({
    resolver: valibotResolver(ContactSchemaValibot),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (
    values: v.InferInput<typeof ContactSchemaValibot>
  ) => {
    try {
      setError("");
      setSuccess("");

      startTransition(async () => {
        // Execute reCAPTCHA first
        setIsRecaptchaLoading(true);
        const recaptchaToken = await getCaptchaToken("contact-form");
        setIsRecaptchaLoading(false);

        if (!recaptchaToken) {
          toast.error("Security verification failed. Please try again.");
          return;
        }

        contact(values, recaptchaToken).then((data) => {
          if (!data.success) {
            setError(data.message);
            setSuccess("");
          }

          if (data.success && typeof window !== "undefined") {
            setError("");
            setSuccess(data.message);
            sendGTMEvent({
              event: "contact_form_submission",
              form_type: "contact",
              form_location: "contact_page",
              page_path: window.location.pathname,
              page_title: document.title,
              email_domain: values.email.split("@")[1],
            });
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
    <Form {...form}>
      <form
        id="contact"
        className="mb-12 lg:mb-0"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-8 mb-4">
          <div className="flex flex-wrap gap-4">
            <GenericInput
              control={form.control}
              label="Name"
              name="name"
              placeholder="Mario Rossi"
              disabled={isSubmitting}
              className="bg-primary-foreground"
            />
            <GenericInput
              control={form.control}
              label="Email"
              name="email"
              placeholder="mario.rossi@gmail.com"
              disabled={isSubmitting}
              className="bg-primary-foreground"
            />
          </div>
          <GenericInput
            control={form.control}
            label="Subject"
            name="subject"
            placeholder="Info"
            disabled={isSubmitting}
            className="bg-primary-foreground"
          />
          <GenericTextarea
            control={form.control}
            label="Messaggio"
            name="message"
            placeholder="Vorrei sapere..."
            disabled={isSubmitting}
            className="bg-primary-foreground"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          * Confermando il modulo accetti la&nbsp;
          <Link
            className="text-primary"
            href="https://www.iubenda.com/privacy-policy/49078580"
          >
            Privacy Policy
          </Link>{" "}
          di Pictures Writers.
        </div>
        <GoogleRecaptchaV3 />
        {error && (
          <div className="p-4 mb-4 bg-destructive text-primary-foreground rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 mb-4 bg-accent shadow-2xs rounded-md">
            {success}
          </div>
        )}
        {isPending || isRecaptchaLoading ? (
          <>
            <BeatLoader />
            {isRecaptchaLoading ? "Verifica..." : "Invio..."}
          </>
        ) : (
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || isRecaptchaLoading}
            className="bg-primary"
          >
            Invia messaggio
          </Button>
        )}
      </form>
    </Form>
  );
};
