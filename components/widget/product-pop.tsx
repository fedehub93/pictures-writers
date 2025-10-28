"use client";

import * as v from "valibot";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useMediaQuery } from "usehooks-ts";
import { BeatLoader } from "react-spinners";
import { valibotResolver } from "@hookform/resolvers/valibot";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { sendGTMEvent } from "@next/third-parties/google";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import { getLocalStorage, setLocalStorage } from "@/lib/storage-helper";
import { Form } from "@/components/ui/form";

import { EbookType, WidgetProductPopActionType } from "@/types";
import { FreeEbookSchemaValibot } from "@/schemas";
import { subscribeFreeEbook } from "@/actions/subscribe-free-ebook";
import { GenericInput } from "@/components/form-component/generic-input";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";

const FREE_EBOOK_MODAL_KEY = "freeEbookModalShown";

interface WidgetProductPopProps {
  rootId: string;
  title: string;
  slug: string;
  imageCoverUrl: string;
  label: string;
  autoOpenDelay: number;
  actionType: WidgetProductPopActionType;
}

export const WidgetProductPop = ({
  rootId,
  title,
  slug,
  imageCoverUrl,
  label,
  actionType,
  autoOpenDelay,
}: WidgetProductPopProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

  const matches = useMediaQuery("(max-width: 768px)");

  const autoOpenDelayMs = autoOpenDelay * 1000;

  const form = useForm<v.InferInput<typeof FreeEbookSchemaValibot>>({
    resolver: valibotResolver(FreeEbookSchemaValibot),
    defaultValues: {
      email: "",
      rootId,
      format: EbookType.PDF,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  useEffect(() => {
    if (true) {
      const lastShown = getLocalStorage(FREE_EBOOK_MODAL_KEY, false);
      const now = new Date().getTime();

      // Controlla se sono passate più di 24 ore
      if (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
        // Apri la modale dopo 5 secondi
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, autoOpenDelayMs);

        // Pulizia del timeout
        return () => clearTimeout(timer);
      }
    }
  }, [matches, autoOpenDelayMs]);

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

  const onHandleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPopupExpiration();
    }

    setIsOpen(isOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onHandleOpenChange}>
      <DialogContent
        className="p-0 py-4 md:py-0 md:w-[700px] md:max-w-[700px] border-0 overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="text-2xl text-center font-bold hidden"></DialogTitle>
        <div className="relative w-full px-0 flex flex-col md:flex-row items-center justify-between">
          <Image
            src={imageCoverUrl}
            alt={title}
            width={600}
            height={600}
            sizes="(max-width: 1280px) 90vw, 20vw"
            quality={75}
            className="w-40 md:w-1/2 rounded-md md:rounded-tr-none md:rounded-br-none object-contain"
          />
          {actionType === WidgetProductPopActionType.GO_TO_PRODUCT && (
            <div className="p-4 px-8  h-full flex flex-col gap-y-6  justify-center">
              <div className="w-full text-lg uppercase font-bold text-primary">
                {label}
              </div>
              <div className="self-start w-14 h-1 bg-primary" />
              <div className="w-full text-3xl font-extrabold leading-8">
                {title}
              </div>
              <Button asChild className="font-bold mt-8">
                <Link
                  href={`/shop/ebooks/${slug}`}
                  prefetch
                >
                  Vai al prodotto
                </Link>
              </Button>
            </div>
          )}
          {actionType === WidgetProductPopActionType.FILL_FORM && (
            <div className="p-4 px-8  h-full flex flex-col gap-y-6 items-center justify-center">
              <div className="w-full text-lg uppercase font-bold text-primary">
                {label}
              </div>
              <div className="self-start w-14 h-1 bg-primary" />
              <div className="w-full text-3xl font-extrabold leading-8">
                {title}
              </div>
              {error && (
                <div className="p-4 bg-destructive shadow-2xs rounded-md mb-2 font-bold">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-emerald-100 shadow-2xs rounded-md mb-2">
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
                        <div className="mb-4 text-xs text-muted-foreground">
                          This site is protected by reCAPTCHA and the Google
                          <Link
                            href="https://policies.google.com/privacy"
                            className="text-primary"
                          >
                            {" "}
                            Privacy Policy
                          </Link>{" "}
                          and
                          <Link
                            href="https://policies.google.com/terms"
                            className="text-primary"
                          >
                            {" "}
                            Terms of Service
                          </Link>{" "}
                          apply.
                        </div>
                      </div>
                      <DialogFooter className="flex flex-row gap-x-2 justify-between">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
