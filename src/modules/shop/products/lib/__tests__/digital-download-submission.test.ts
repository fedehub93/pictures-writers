import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/subscribe-free-digital-product", () => ({
  subscribeFreeDigitalProduct: vi.fn(),
}));

vi.mock("@next/third-parties/google", () => ({
  sendGTMEvent: vi.fn(),
}));

import { sendGTMEvent } from "@next/third-parties/google";

import { subscribeFreeDigitalProduct } from "@/actions/subscribe-free-digital-product";

import {
  PRODUCT_DETAIL_PAGE_SOURCE,
  buildDigitalDownloadEvent,
} from "../digital-download-event";
import { submitDigitalDownload } from "../digital-download-submission";

const values = {
  rootId: "product-root-1",
  email: "reader@example.com",
  privacyConsent: true,
};

const event = buildDigitalDownloadEvent({
  productId: values.rootId,
  productSlug: "workbook-gratuito",
  productName: "Workbook gratuito",
  formId: "form-1",
  source: PRODUCT_DETAIL_PAGE_SOURCE,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitDigitalDownload", () => {
  it("submits to the action and fires the GTM event on success", async () => {
    vi.mocked(subscribeFreeDigitalProduct).mockResolvedValue({
      success: true,
      message: "Check your email.",
    });

    const result = await submitDigitalDownload({
      values,
      recaptchaToken: "token",
      event,
    });

    expect(subscribeFreeDigitalProduct).toHaveBeenCalledWith(values, "token");
    expect(sendGTMEvent).toHaveBeenCalledWith(event);
    expect(result.success).toBe(true);
  });

  it("does not report a download that failed", async () => {
    vi.mocked(subscribeFreeDigitalProduct).mockResolvedValue({
      success: false,
      message: "Try again.",
    });

    const result = await submitDigitalDownload({
      values,
      recaptchaToken: "token",
      event,
    });

    expect(sendGTMEvent).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});
