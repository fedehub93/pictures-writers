export const DIGITAL_DOWNLOAD_EVENT_NAME = "digital_download";

export const PRODUCT_DETAIL_PAGE_SOURCE = "product_detail_page";

export type DigitalDownloadSource = typeof PRODUCT_DETAIL_PAGE_SOURCE;

interface DigitalDownloadEventInput {
  productId: string;
  productSlug: string;
  productName: string;
  formId: string;
  source: DigitalDownloadSource;
}

export interface DigitalDownloadEvent {
  event: typeof DIGITAL_DOWNLOAD_EVENT_NAME;
  product_id: string;
  product_slug: string;
  product_name: string;
  form_id: string;
  source: DigitalDownloadSource;
}

export const buildDigitalDownloadEvent = ({
  productId,
  productSlug,
  productName,
  formId,
  source,
}: DigitalDownloadEventInput): DigitalDownloadEvent => ({
  event: DIGITAL_DOWNLOAD_EVENT_NAME,
  product_id: productId,
  product_slug: productSlug,
  product_name: productName,
  form_id: formId,
  source,
});
