"use client";

import * as v from "valibot";
import Image from "next/image";
import { Dispatch, SetStateAction, useState, useTransition } from "react";
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

interface FreeEbookModalProps {
  rootId: string;
  title: string;
  imageCoverUrl: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const FreeEbookModal = ({
  rootId,
  title,
  imageCoverUrl,
  isOpen = false,
  setIsOpen,
}: FreeEbookModalProps) => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<v.InferInput<typeof FreeEbookSchemaValibot>>({
    resolver: valibotResolver(FreeEbookSchemaValibot),
    defaultValues: {
      email: "",
      rootId,
      format: EbookType.PDF,
    },
  });

  const { isSubmitting, isValid } = form.formState;

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-col items-center mt-4">
          <DialogTitle className="text-xl text-center mb-2 mt-2 rounded-md bg-violet-100 w-full p-1 font-bold text-primary-public block italic">
            {title}
          </DialogTitle>
          <DialogDescription>
            Scarica{" "}
            <span className="rounded-md bg-primary-public p-1 text-secondary">
              l&apos;ebook gratuito
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full bg-white px-6 py-2 flex flex-col gap-y-4 items-center">
          <Image
            src={imageCoverUrl}
            alt="eBook gratuito sull'introduzione alla sceneggiatura cinematografica"
            width={150}
            height={150}
            sizes="(max-width: 1280px) 90vw, 20vw"
            quality={50}
          />
          {error && (
            <div className="p-4 bg-destructive shadow-2xs rounded-md font-bold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-100 shadow-2xs rounded-md">
              {success}
            </div>
          )}

          {isPending && !success ? <BeatLoader className="mx-auto" /> : null}

          {!isPending && !success && (
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
