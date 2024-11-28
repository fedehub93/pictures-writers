"use client";

import * as v from "valibot";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useMediaQuery } from "usehooks-ts";
import { BeatLoader } from "react-spinners";
import { valibotResolver } from "@hookform/resolvers/valibot";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getLocalStorage, setLocalStorage } from "@/lib/storage-helper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FreeEbookSchemaValibot } from "@/schemas";
import { subscribeFreeEbook } from "@/actions/subscribe-free-ebook";
import { EbookType } from "@/types";

const FREE_EBOOK_MODAL_KEY = "freeEbookModalShown";

export const FreeEbookModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const matches = useMediaQuery("(max-width: 768px)");

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

  useEffect(() => {
    if (matches) {
      const lastShown = getLocalStorage(FREE_EBOOK_MODAL_KEY, false);
      const now = new Date().getTime();

      // Controlla se sono passate più di 24 ore
      if (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
        // Apri la modale dopo 5 secondi
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 20000);

        // Pulizia del timeout
        return () => clearTimeout(timer);
      }
    }
  }, [matches]);

  // Funzione per impostare l'expire time nel localStorage
  const setPopupExpiration = () => {
    const now = new Date().getTime();
    setLocalStorage(FREE_EBOOK_MODAL_KEY, now.toString());
  };

  const onHandleSubmit = async (
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

  const onHandleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPopupExpiration();
    }

    setIsOpen(isOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onHandleOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-col items-center mt-4">
          <DialogTitle className="text-base text-center uppercase mb-2 mt-2 rounded-md bg-violet-100 p-1 font-bold text-primary-public block italic">
            Introduzione alla sceneggiatura cinematografica
          </DialogTitle>
          <DialogDescription>
            Scarica{" "}
            <span className="rounded-md bg-primary-public p-1 text-secondary">
              l&apos;ebook gratuito
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full bg-white px-6 py-2 flex flex-col items-center">
          <Image
            src="/ebook.png"
            alt="eBook gratuito sull'introduzione alla sceneggiatura cinematografica"
            width={150}
            height={150}
            sizes="(max-width: 1280px) 90vw, 20vw"
            quality={50}
          />
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

          {isPending && !success ? (
            <BeatLoader className="mx-auto" />
          ) : (
            <Form {...form}>
              <form
                className="flex items-center gap-x-2"
                onSubmit={form.handleSubmit(onHandleSubmit)}
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
                    </Link>{" "}
                    di Pictures Writers.
                  </div>
                  <DialogFooter className="flex flex-row gap-x-2 justify-between">
                    <DialogClose asChild className="flex-1">
                      <Button type="button">Close</Button>
                    </DialogClose>
                    <Button
                      className="flex-1"
                      type="submit"
                      disabled={isSubmitting || !isValid}
                    >
                      Download eBook
                    </Button>
                  </DialogFooter>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
