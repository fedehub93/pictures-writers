"use client";

import * as v from "valibot";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import Link from "next/link";
import { useState, useTransition } from "react";
import { BeatLoader } from "react-spinners";

import { subscribe } from "@/actions/subscribe";
import { SubscribeSchemaValibot } from "@/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface WidgetNewsletter {
  label: string;
}

const WidgetNewsletter = ({ label }: WidgetNewsletter) => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

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
        subscribe(values).then((data) => {
          setError(data.error);
          setSuccess(data.success);
        });
      });
    } catch (error) {
      setError(
        "Qualcosa è andato storto. Prego riprovare o contattare il supporto."
      );
    }
  };

  return (
    <div className="snippet newsletter relative">
      <h6 id="#newsletter_form" className="snippet__title">
        {label}
      </h6>
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
              <li>Aggiornamenti sui più importanti concorsi di sceneggiatura.</li>
              <li>Nuovi eventi online di Pictures Writers.</li>
            </ul>
          </div>
          <div className="mb-2">
            * Confermando il modulo accetti la&nbsp;
            <Link
              className="text-primary-public"
              href="https://www.iubenda.com/privacy-policy/49078580"
            >
              Privacy Policy
            </Link>{" "}
            di Pictures Writers.
          </div>
          {isPending ? (
            <BeatLoader className="mx-auto" />
          ) : (
            <Form {...form}>
              <form
                className="flex items-center gap-x-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          placeholder="mario.rossi@gmail.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="self-end"
                  disabled={isSubmitting || !isValid}
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
