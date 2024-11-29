"use client";

import * as v from "valibot";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState, useTransition } from "react";
import { Globe, Mail } from "lucide-react";
import Link from "next/link";
import { BeatLoader } from "react-spinners";

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
import { Textarea } from "@/components/ui/textarea";
import { contact } from "@/actions/contact";
import { ContactSchemaValibot } from "@/schemas";

export const ContactUs = (): JSX.Element => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

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
        contact(values).then((data) => {
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
    <section className="px-4 py-20 lg:px-6">
      <div className="mx-auto max-w-lg md:max-w-screen-md lg:max-w-6xl">
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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-auto min-w-60">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            disabled={isSubmitting}
                            placeholder="Mario Rossi"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-auto min-w-60">
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
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          placeholder="Info"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isSubmitting}
                          placeholder="I want to ask you..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              {error && <div className="p-4 mb-4 bg-destructive">{error}</div>}
              {success && (
                <div className="p-4 mb-4 bg-emerald-100 shadow-sm rounded-md">
                  {success}
                </div>
              )}
              {isPending ? (
                <BeatLoader />
              ) : (
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="bg-primary-public"
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
