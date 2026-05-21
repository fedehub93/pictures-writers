"use client";

import * as v from "valibot";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import Link from "next/link";
import { useState, useTransition } from "react";
import { BeatLoader } from "react-spinners";
import { sendGTMEvent } from "@next/third-parties/google";
import toast from "react-hot-toast";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { SubscribeSchemaValibot } from "@/schemas";

import { subscribe } from "@/actions/subscribe";

import { GoogleRecaptchaV3 } from "@/components/google-recaptchav3";

import { GenericInput } from "@/components/form-component/generic-input";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";

interface WidgetNewsletter {
  label: string;
}

const WidgetNewsletter = ({ label }: WidgetNewsletter) => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

  const form = useForm<v.InferInput<typeof SubscribeSchemaValibot>>({
    resolver: valibotResolver(SubscribeSchemaValibot),
    defaultValues: {
      email: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (
    values: v.InferInput<typeof SubscribeSchemaValibot>
  ) => {
    try {
      setError("");
      setSuccess("");

      startTransition(async () => {
        // Execute reCAPTCHA first
        setIsRecaptchaLoading(true);
        const recaptchaToken = await getCaptchaToken("subscribe_newsletter");
        setIsRecaptchaLoading(false);

        if (!recaptchaToken) {
          toast.error("Security verification failed. Please try again.");
          return;
        }

        subscribe(values, recaptchaToken).then((data) => {
          if (!data.success) {
            setError(data.message);
            setSuccess("");
          }

          if (data.success && typeof window !== "undefined") {
            setError("");
            setSuccess(data.message);
            sendGTMEvent({
              event: "newsletter_signup",
              form_type: "newsletter",
              form_location: "blog_post_bottom",
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
    <div id="newsletter_form" className="snippet newsletter relative">
      <h6 className="snippet__title">{label}</h6>
      {success && (
        <div className="newsletter__success">
          <p>
            Benvenuto a bordo, ti ringraziamo per esserti iscritto alla nostra
            newsletter.
          </p>
          <p>
            <strong>
              Ti abbiamo inviato una email per confermare la tua sottoscrizione.
            </strong>
          </p>
          <p>
            Promettiamo di non essere invadenti e vogliamo ricordarti che potrai
            annullare la sottoscrizione direttamente dalle email che riceverai.
          </p>
          <p>Grazie ancora per esserti unito a noi.</p>
        </div>
      )}
      {error && (
        <div className="newsletter__error">
          <p>Ooops, qualcosa è andato storto...</p>
          <p>
            Per favore,{" "}
            <button type="button" onClick={() => setError("")}>
              <u>riprova</u>
            </button>{" "}
            oppure contattaci scrivendo a{" "}
            <strong>support@pictureswriters.com</strong>.
          </p>
        </div>
      )}
      {!success && !error && (
        <>
          <div className="newsletter__box">
            Iscriviti alla nostra community di sceneggiatori e riceverai news
            settimanali direttamente sulla tua email:
            <br />
            <br />
            <ul className="list-disc pl-4">
              <li>Articoli più popolari e news sul settore.</li>
              <li>
                Aggiornamenti sui più importanti concorsi di sceneggiatura.
              </li>
              <li>Nuovi eventi online di Pictures Writers.</li>
            </ul>
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
          {isPending || isRecaptchaLoading ? (
            <>
              <BeatLoader />
              {isRecaptchaLoading ? "Verifica..." : "Invio..."}
            </>
          ) : (
            <Form {...form}>
              <form
                className="flex items-center gap-x-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <GenericInput
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="mario.rossi@gmail.com"
                  disabled={isSubmitting}
                  containerProps={{ className: "flex-1" }}
                />
                <Button
                  type="submit"
                  className="self-end"
                  disabled={!isValid || isSubmitting || isRecaptchaLoading}
                >
                  Iscriviti
                </Button>
              </form>
            </Form>
          )}
        </>
      )}
    </div>
  );
};

export default WidgetNewsletter;
