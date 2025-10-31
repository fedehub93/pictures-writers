"use client";

import * as v from "valibot";
import Image from "next/image";
import { Dispatch, SetStateAction, useState, useTransition } from "react";
import { BeatLoader } from "react-spinners";
import { valibotResolver } from "@hookform/resolvers/valibot";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { sendGTMEvent } from "@next/third-parties/google";
import toast from "react-hot-toast";

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
import { Form } from "@/components/ui/form";

import { EbookType } from "@/types";
import { FreeEbookSchemaValibot } from "@/schemas";

import { subscribeFreeEbook } from "@/actions/subscribe-free-ebook";
import { GoogleRecaptchaV3 } from "@/components/google-recaptchav3";

import { GenericInput } from "@/components/form-component/generic-input";

import { getCaptchaToken } from "../utils/captcha";

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
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

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
        // Execute reCAPTCHA first
        setIsRecaptchaLoading(true);
        const recaptchaToken = await getCaptchaToken("subscribe_product");
        setIsRecaptchaLoading(false);

        if (!recaptchaToken) {
          toast.error("Security verification failed. Please try again.");
          return;
        }

        subscribeFreeEbook(values, recaptchaToken).then((data) => {
          if (!data.success) {
            setError(data.message);
            setSuccess("");
          }

          if (data.success && typeof window !== "undefined") {
            setError("");
            setSuccess(data.message);
            sendGTMEvent({
              event: "ebook_download",
              product_name: title,
              product_id: rootId,
              form_type: "ebook",
              form_location: "ebook_details_page",
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-col items-center mt-4">
          <DialogTitle className="text-xl text-center mb-2 mt-2 rounded-md bg-accent w-full p-1 font-bold text-primary-public block italic">
            {title}
          </DialogTitle>
          <DialogDescription>
            Scarica{" "}
            <span className="rounded-md text-primary p-1">
              l&apos;ebook gratuito
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full px-6 py-2 flex flex-col gap-y-8 items-center">
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
            <div className="p-4 bg-primary shadow-2xs rounded-md text-primary-foreground">
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
                  <GenericInput
                    control={form.control}
                    name="email"
                    label="Email"
                    placeholder="mario.rossi@gmail.com"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="text-xs text-muted-foreground">
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
                  </div>
                  <DialogFooter className="flex flex-row gap-x-2 justify-between">
                    <DialogClose asChild className="flex-1">
                      <Button type="button">Close</Button>
                    </DialogClose>
                    <Button
                      className="flex-1"
                      type="submit"
                      disabled={!isValid || isSubmitting || isRecaptchaLoading}
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
