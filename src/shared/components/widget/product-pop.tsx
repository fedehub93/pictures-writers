"use client";

import type { z } from "zod";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useMediaQuery } from "usehooks-ts";
import { BeatLoader } from "react-spinners";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/shared/ui/dialog";

import { getLocalStorage, setLocalStorage } from "@/lib/storage-helper";
import { Form } from "@/shared/ui/form";

import { WidgetProductPopActionType } from "@/types";
import {
  PRODUCT_POP_SOURCE,
  buildDigitalDownloadEvent,
} from "@/modules/shop/products/lib/digital-download-event";
import { submitDigitalDownload } from "@/modules/shop/products/lib/digital-download-submission";
import { FreeDigitalDownloadSchema } from "@/schemas";

import { GoogleRecaptchaV3 } from "@/shared/components/google-recaptchav3";

import { GenericInput } from "@/shared/components/form-component/generic-input";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";

const FREE_DIGITAL_DOWNLOAD_MODAL_KEY = "freeEbookModalShown";

interface WidgetProductPopProps {
  rootId: string;
  title: string;
  slug: string;
  formId: string | null;
  imageCoverUrl: string;
  label: string;
  autoOpenDelay: number;
  actionType: WidgetProductPopActionType;
}

export const WidgetProductPop = ({
  rootId,
  title,
  slug,
  formId,
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

  const form = useForm<z.input<typeof FreeDigitalDownloadSchema>>({
    resolver: zodResolver(FreeDigitalDownloadSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      rootId,
      privacyConsent: false,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  useEffect(() => {
    if (true) {
      const lastShown = getLocalStorage(FREE_DIGITAL_DOWNLOAD_MODAL_KEY, false);
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
    setLocalStorage(FREE_DIGITAL_DOWNLOAD_MODAL_KEY, now.toString());
  };

  const onHandleSubmit = (
    values: z.input<typeof FreeDigitalDownloadSchema>,
  ) => {
    if (!formId) {
      setError("Questo prodotto non ha ancora un modulo di download.");
      return;
    }

    startTransition(async () => {
      try {
        setError("");
        setSuccess("");

        setIsRecaptchaLoading(true);
        const recaptchaToken = await getCaptchaToken("subscribe_product");
        setIsRecaptchaLoading(false);

        if (!recaptchaToken) {
          toast.error("Security verification failed. Please try again.");
          return;
        }

        const data = await submitDigitalDownload({
          values,
          recaptchaToken,
          event: buildDigitalDownloadEvent({
            productId: rootId,
            productSlug: slug,
            productName: title,
            formId,
            source: PRODUCT_POP_SOURCE,
          }),
        });

        if (!data.success) {
          setError(data.message);
          return;
        }

        setSuccess(data.message);
      } catch (_error) {
        setIsRecaptchaLoading(false);
        setError(
          "Qualcosa è andato storto. Prego riprovare o contattare il supporto.",
        );
        setSuccess("");
      }
    });
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
                  <Link href={`/shop/ebooks/${slug}`}>
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
              {!formId ? (
                <Button asChild className="font-bold mt-8">
                <Link href={`/shop/ebooks/${slug}`}>
                    Vai al prodotto
                  </Link>
                </Button>
              ) : (
                <>
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
                          <Controller
                            control={form.control}
                            name="privacyConsent"
                            render={({ field }) => (
                              <div className="flex items-start gap-x-2">
                                <Checkbox
                                  id="product-pop-privacy"
                                  checked={field.value === true}
                                  onCheckedChange={(checked) =>
                                    field.onChange(checked === true)
                                  }
                                  disabled={isSubmitting}
                                />
                                <label
                                  htmlFor="product-pop-privacy"
                                  className="text-xs text-muted-foreground"
                                >
                                  Accetto la{" "}
                                  <Link
                                    className="text-primary"
                                    href="https://www.iubenda.com/privacy-policy/49078580"
                                  >
                                    Privacy Policy
                                  </Link>{" "}
                                  di Pictures Writers.
                                </label>
                              </div>
                            )}
                          />
                          <div>
                            <GoogleRecaptchaV3 />
                          </div>
                          <DialogFooter className="flex flex-row gap-x-2 justify-between">
                            <Button
                              className="flex-1"
                              type="submit"
                              disabled={
                                isSubmitting || !isValid || isRecaptchaLoading
                              }
                            >
                              Scarica gratis
                            </Button>
                          </DialogFooter>
                        </div>
                      </form>
                    </Form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
