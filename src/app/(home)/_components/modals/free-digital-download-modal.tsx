"use client";

import { Dispatch, SetStateAction, useState } from "react";
import Image from "next/image";
import { CircleCheck } from "lucide-react";

import {
  PRODUCT_DETAIL_PAGE_SOURCE,
  buildDigitalDownloadEvent,
} from "@/modules/shop/products/lib/digital-download-event";
import { submitDigitalDownload } from "@/modules/shop/products/lib/digital-download-submission";
import {
  extractFreeDigitalDownloadFields,
  resolveFreeDigitalDownloadFormContent,
} from "@/modules/shop/products/lib/free-download-form";
import { FormRunner } from "@/modules/forms/builder/runner/form-runner";
import type { FormRootInstance } from "@/modules/forms/builder/types/core";
import { GoogleRecaptchaV3 } from "@/shared/components/google-recaptchav3";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { getCaptchaToken } from "../utils/captcha";

interface FreeDigitalDownloadModalProps {
  rootId: string;
  formId: string;
  content?: FormRootInstance | null;
  gtmEventName?: string | null;
  productSlug: string;
  title: string;
  imageCoverUrl: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const FreeDigitalDownloadModal = ({
  rootId,
  formId,
  content,
  gtmEventName,
  productSlug,
  title,
  imageCoverUrl,
  isOpen,
  setIsOpen,
}: FreeDigitalDownloadModalProps) => {
  const [success, setSuccess] = useState<string | undefined>("");

  const resolvedContent = resolveFreeDigitalDownloadFormContent(content);

  const onHandleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setSuccess("");
  };

  const onHandleSubmit = async (values: Record<string, unknown>) => {
    const { email, privacyConsent } = extractFreeDigitalDownloadFields(
      values,
      resolvedContent,
    );

    const recaptchaToken = await getCaptchaToken("subscribe_product");

    if (!recaptchaToken) {
      return {
        success: false,
        message: "Security verification failed. Please try again.",
      };
    }

    const data = await submitDigitalDownload({
      values: {
        ...values,
        email,
        rootId,
        privacyConsent,
      },
      recaptchaToken,
      event: buildDigitalDownloadEvent({
        productId: rootId,
        productSlug,
        productName: title,
        formId,
        source: PRODUCT_DETAIL_PAGE_SOURCE,
      }),
    });

    if (data.success) {
      setSuccess(data.message);
    }

    return data;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onHandleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Inserisci la tua email per ricevere il link al prodotto gratuito.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6">
          {imageCoverUrl && (
            <Image
              src={imageCoverUrl}
              alt={`Copertina di ${title}`}
              width={150}
              height={150}
              sizes="(max-width: 1280px) 90vw, 20vw"
              quality={75}
            />
          )}

          {success ? (
            <Alert>
              <CircleCheck />
              <AlertTitle>Controlla la tua email</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : (
            <>
              <FormRunner
                id={formId}
                onSubmitHandler={onHandleSubmit}
                content={resolvedContent}
                gtmEventName={gtmEventName ?? null}
              />
              <GoogleRecaptchaV3 />
            </>
          )}

          <DialogFooter className="w-full flex-row justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Chiudi
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
