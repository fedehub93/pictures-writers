import { describe, expect, it } from "vitest";

import {
  PRODUCT_DETAIL_PAGE_SOURCE,
  buildDigitalDownloadEvent,
} from "../digital-download-event";

describe("digital download GTM event", () => {
  it("carries the product and form identifiers marketing needs to drill down", () => {
    const event = buildDigitalDownloadEvent({
      productId: "product-root-1",
      productSlug: "workbook-gratuito",
      productName: "Workbook gratuito",
      formId: "form-1",
      source: PRODUCT_DETAIL_PAGE_SOURCE,
    });

    expect(event).toEqual({
      event: "digital_download",
      product_id: "product-root-1",
      product_slug: "workbook-gratuito",
      product_name: "Workbook gratuito",
      form_id: "form-1",
      source: "product_detail_page",
    });
  });
});
