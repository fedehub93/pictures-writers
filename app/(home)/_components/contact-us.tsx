"use client";

import * as v from "valibot";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState, useTransition, type JSX } from "react";
import { Globe, Mail } from "lucide-react";
import Link from "next/link";
import { BeatLoader } from "react-spinners";
import { sendGTMEvent } from "@next/third-parties/google";
import toast from "react-hot-toast";

import { Form } from "@/components/ui/form";

import { Button } from "@/components/ui/button";

import { contact } from "@/actions/contact";
import { ContactSchemaValibot } from "@/schemas";

import { GoogleRecaptchaV3 } from "@/components/google-recaptchav3";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericTextarea } from "@/components/form-component/generic-textarea";

import { getCaptchaToken } from "./utils/captcha";

export const ContactUs = (): JSX.Element => {
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
              form_location: "home_page",
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
    <section className="px-4 py-20 lg:px-6 bg-primary-foreground">
      <div className="mx-auto max-w-lg md:max-w-(--breakpoint-md) lg:max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold">Contattaci</h2>
        <p className="mx-auto mb-12 max-w-lg text-center ">
          Hai domande o desideri ricevere ulteriori informazioni? Siamo qui per
          ascoltarti, rispondere alle tue richieste e fornirti tutto il supporto
          di cui hai bisogno nella tua avventura nella sceneggiatura
          cinematografica.
        </p>
        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-20">
          <Form {...form}>
            <form
              className="mb-12 lg:mb-0"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="flex flex-col gap-4 mb-4">
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
              {error && <div className="p-4 mb-4 bg-destructive">{error}</div>}
              {success && (
                <div className="p-4 mb-4 bg-primary shadow-2xs rounded-md">
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
                  className="bg-primary mt-4"
                >
                  Invia messaggio
                </Button>
              )}
            </form>
          </Form>
          <ul className=" last:mb-0">
            <li>
              <a
                className="mb-5 flex items-start justify-start gap-1"
                href="mailto:support@pictureswriters.com"
              >
                <Mail className="h-5 w-5" />
                <span>: support@pictureswriters.com</span>
              </a>
            </li>
            <li>
              <Link
                href="/"
                className="mb-5 flex items-start justify-start gap-1"
              >
                <Globe className="h-5 w-5" />
                <span>: https://pictureswriters.com</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
