"use client";

import { Dispatch, SetStateAction, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { CircleAlert, CircleCheck } from "lucide-react";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";

import {
  PRODUCT_DETAIL_PAGE_SOURCE,
  buildDigitalDownloadEvent,
} from "@/modules/shop/products/lib/digital-download-event";
import { submitDigitalDownload } from "@/modules/shop/products/lib/digital-download-submission";
import { FreeDigitalDownloadSchemaValibot } from "@/schemas";
import { GoogleRecaptchaV3 } from "@/shared/components/google-recaptchav3";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Form } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

import { getCaptchaToken } from "../utils/captcha";

interface FreeDigitalDownloadModalProps {
  rootId: string;
  formId: string;
  productSlug: string;
  title: string;
  imageCoverUrl: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const FreeDigitalDownloadModal = ({
  rootId,
  formId,
  productSlug,
  title,
  imageCoverUrl,
  isOpen,
  setIsOpen,
}: FreeDigitalDownloadModalProps) => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

  const form = useForm<v.InferInput<typeof FreeDigitalDownloadSchemaValibot>>({
    resolver: valibotResolver(FreeDigitalDownloadSchemaValibot),
    mode: "onChange",
    defaultValues: {
      email: "",
      rootId,
      privacyConsent: false,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onHandleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setError("");
    setSuccess("");

    if (!open) {
      form.reset();
    }
  };

  const onHandleSubmit = (
    values: v.InferInput<typeof FreeDigitalDownloadSchemaValibot>,
  ) => {
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
            productSlug,
            productName: title,
            formId,
            source: PRODUCT_DETAIL_PAGE_SOURCE,
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

          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>Download non riuscito</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CircleCheck />
              <AlertTitle>Controlla la tua email</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {isPending && !success ? <BeatLoader className="mx-auto" /> : null}

          {!isPending && !success && (
            <Form {...form}>
              <form
                className="w-full"
                onSubmit={form.handleSubmit(onHandleSubmit)}
              >
                <FieldGroup>
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="free-digital-download-email">
                          Email
                        </FieldLabel>
                        <Input
                          {...field}
                          id="free-digital-download-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="mario.rossi@gmail.com"
                          aria-invalid={fieldState.invalid}
                          disabled={isSubmitting}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="privacyConsent"
                    render={({ field, fieldState }) => (
                      <Field
                        orientation="horizontal"
                        data-invalid={fieldState.invalid}
                      >
                        <Checkbox
                          id="free-digital-download-privacy"
                          checked={field.value === true}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                          aria-invalid={fieldState.invalid}
                          disabled={isSubmitting}
                        />
                        <FieldContent>
                          <FieldLabel htmlFor="free-digital-download-privacy">
                            Accetto la{" "}
                            <Link
                              href="https://www.iubenda.com/privacy-policy/49078580"
                              className="text-primary underline"
                            >
                              Privacy Policy
                            </Link>{" "}
                            di Pictures Writers.
                          </FieldLabel>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </FieldContent>
                      </Field>
                    )}
                  />

                  <GoogleRecaptchaV3 />

                  <DialogFooter className="flex-row justify-between gap-2">
                    <DialogClose asChild className="flex-1">
                      <Button type="button" variant="outline">
                        Chiudi
                      </Button>
                    </DialogClose>
                    <Button
                      className="flex-1"
                      type="submit"
                      disabled={
                        !isValid || isSubmitting || isRecaptchaLoading
                      }
                    >
                      Scarica gratis
                    </Button>
                  </DialogFooter>
                </FieldGroup>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
