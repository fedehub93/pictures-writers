"use client";

import * as v from "valibot";

import { valibotResolver } from "@hookform/resolvers/valibot";
import Image from "next/image";
import { useState, useTransition, type JSX } from "react";
import { useForm } from "react-hook-form";
import { BeatLoader } from "react-spinners";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FreeEbookSchemaValibot } from "@/schemas";
import { subscribeFreeEbook } from "@/actions/subscribe-free-ebook";

import { EbookType } from "@/types";

export const HeroSection = (): JSX.Element => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<v.InferInput<typeof FreeEbookSchemaValibot>>({
    resolver: valibotResolver(FreeEbookSchemaValibot),
    defaultValues: {
      email: "",
      // ebookId: "e5ec60b7-bffd-412b-8383-72fcf74a5516",
      rootId: "ccb34a74-8738-4fe3-8a47-e3659ca15c91",
      format: EbookType.PDF,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (
    values: v.InferInput<typeof FreeEbookSchemaValibot>
  ) => {
    try {
      setError("");
      setSuccess("");

      startTransition(async () => {
        subscribeFreeEbook(values).then((data) => {
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
    <section className="w-full bg-violet-100/40 px-4 lg:px-6 py-24">
      <div className="mx-auto max-w-lg text-center md:max-w-screen-md lg:max-w-6xl lg:text-left">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-y-10">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl xl:text-6xl">
              Vuoi diventare <br />
              <span className="text-primary-public">uno sceneggiatore?</span>
            </h1>
            <p>
              <span className="mt-2 rounded-md bg-violet-100 p-1 font-bold text-primary-public">
                La nostra missione è alimentare la tua fiamma creativa
              </span>
              , fornendoti l&apos;ispirazione, l&apos;istruzione e la comunità
              di supporto di cui hai bisogno per diventare uno sceneggiatore di
              successo.
            </p>
            <p>
              Pronto a dare vita alle tue idee sul grande schermo?
              <br />
              <span className="font-bold text-primary-public">
                Scarica il nostro eBook gratuito:
              </span>
              &nbsp;
              <span className="font-bold italic text-black">
                Introduzione alla sceneggiatura cinematografica
              </span>
              , e inizia a scrivere le tue storie di successo.
            </p>
            <div>
              <Button asChild type="button">
                <Link href="/ebooks/introduzione-alla-sceneggiatura">
                  Vai all&apos;Ebook
                </Link>
              </Button>
            </div>
            {/* {error && <div className="p-4 bg-destructive">{error}</div>}
            {success && (
              <div className="p-4 bg-emerald-100 shadow-sm rounded-md">
                {success}
              </div>
            )}

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
            )} */}
          </div>
          <div className="mb-12 rounded-lg lg:mb-0 aspect-square relative">
            <Image
              alt="jumbotron"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 90vw, 35vw"
              src="/story-book.png"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};
