"use client";

import * as z from "zod";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BeatLoader } from "react-spinners";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FreeEbookSchema } from "@/schemas";
import { subscribeFreeEbook } from "@/actions/subscribe-free-ebook";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const SidebarEbook = (): JSX.Element => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof FreeEbookSchema>>({
    resolver: zodResolver(FreeEbookSchema),
    defaultValues: {
      email: "",
      ebookId: "e5ec60b7-bffd-412b-8383-72fcf74a5516",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof FreeEbookSchema>) => {
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
    <div className="relative w-full bg-white px-6 py-8 shadow-md flex flex-col">
      <h3 className="mb-4 text-sm font-extrabold uppercase">Ebook gratuito</h3>
      <Image
        src="/ebook.png"
        alt="eBook gratuito sull'introduzione alla sceneggiatura cinematografica"
        width={2000}
        height={2000}
        sizes="(max-width: 1280px) 90vw, 20vw"
        quality={50}
      />
      <div className="mb-4">
        Non sai da dove iniziare?
        <br /> Scarica{" "}
        <span className="rounded-md bg-primary-public p-1 text-secondary">
          l&apos;ebook gratuito
        </span>
        su: <br />
        <span className="mt-2 rounded-md bg-violet-100 p-1 font-bold text-primary-public block italic">
          Introduzione alla sceneggiatura cinematografica
        </span>
      </div>
      {error && (
        <div className="p-4 bg-destructive shadow-sm rounded-md mb-2 font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-100 shadow-sm rounded-md mb-2">
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
            <div className="flex flex-col gap-y-4">
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
              <div>
                * Confermando il modulo accetti la&nbsp;
                <Link
                  className="text-primary-public"
                  href="https://www.iubenda.com/privacy-policy/49078580"
                >
                  Privacy Policy
                </Link>
              </div>
              <Button type="submit" disabled={isSubmitting || !isValid}>
                Download eBook
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default SidebarEbook;
