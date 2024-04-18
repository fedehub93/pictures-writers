"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { subscribe } from "@/actions/subscribe";
import { SubscribeSchema } from "@/schemas";
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

const NewsletterWidget = (): JSX.Element => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof SubscribeSchema>>({
    resolver: zodResolver(SubscribeSchema),
    defaultValues: {
      email: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof SubscribeSchema>) => {
    try {
      setIsLoading(true);

      setError("");
      setSuccess("");

      startTransition(() => {
        subscribe(values).then((data) => {
          setError(data.error);
          setSuccess(data.success);
        });
      });
    } catch (error) {
      setStatus("ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="snippet newsletter">
      <h6 className="snippet__title">Pictures Writers Newsletter</h6>
      {status === "SUCCESS" && (
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
      {status === "ERROR" && (
        <div className="newsletter__error">
          <p>Ooops, qualcosa è andato storto...</p>
          <p>
            Per favore,{" "}
            <button type="button" onClick={() => setStatus(null)}>
              <u>riprova</u>
            </button>{" "}
            oppure contattaci scrivendo a{" "}
            <strong>support@pictureswriters.com</strong>.
          </p>
        </div>
      )}
      {status === null && (
        <>
          <div className="newsletter__box">
            Iscriviti alla nostra community di sceneggiatori e riceverai news
            settimanali direttamente sulla tua email:
            <br />
            <br />
            <ul className="list-disc pl-4">
              <li>Articoli più popolari e news sul settore.</li>
              <li>Nuovi eventi online di Pictures Writers.</li>
            </ul>
          </div>
          <div className="mb-4">
            * Confermando il modulo accetti la&nbsp;
            <Link
              className="text-primary-public"
              href="https://www.iubenda.com/privacy-policy/49078580"
            >
              Privacy Policy
            </Link>{" "}
            di Pictures Writers.
          </div>
          {isLoading ? (
            <Loader2 className="animate" />
          ) : (
            <Form {...form}>
              <form className="flex items-center gap-x-2" onSubmit={form.handleSubmit(onSubmit)}>
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
                <Button type="submit" className="self-end" disabled={isSubmitting || !isValid}>
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

export default NewsletterWidget;
