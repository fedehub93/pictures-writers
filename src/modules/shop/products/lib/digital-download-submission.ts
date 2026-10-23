import { sendGTMEvent } from "@next/third-parties/google";

import { subscribeFreeDigitalProduct } from "@/actions/subscribe-free-digital-product";

import type { DigitalDownloadEvent } from "./digital-download-event";

interface SubmitDigitalDownloadInput {
  values: Parameters<typeof subscribeFreeDigitalProduct>[0];
  recaptchaToken: string;
  event: DigitalDownloadEvent;
}

/**
 * Submits a download and reports it to analytics only when the download was
 * actually delivered, so the event never over-counts failed attempts.
 */
export const submitDigitalDownload = async ({
  values,
  recaptchaToken,
  event,
}: SubmitDigitalDownloadInput) => {
  const result = await subscribeFreeDigitalProduct(values, recaptchaToken);

  if (result.success) {
    sendGTMEvent(event);
  }

  return result;
};
