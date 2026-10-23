import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ProductAcquisitionMode } from "@/generated/prisma";
import { EbookType } from "@/modules/shop/products/types";

vi.mock("@/app/(home)/_components/modals/free-digital-download-modal", () => ({
  FreeDigitalDownloadModal: ({
    content,
  }: {
    content?: { children: unknown[] } | null;
  }) => (
    <div>
      generic-download-modal:{String(content?.children.length ?? "no-content")}
    </div>
  ),
}));

import { EbookInfo } from "../ebook-info";

const baseProps = {
  rootId: "product-root-1",
  slug: "workbook-gratuito",
  title: "Workbook gratuito",
  imageCoverUrl: "https://cdn.test/cover.jpg",
  acquisitionMode: ProductAcquisitionMode.FORM,
  price: 0,
  discountedPrice: 0,
  formats: [
    { type: EbookType.PDF, url: "https://cdn.test/book.pdf", size: 1024, pages: 12 },
  ],
  author: null,
  publishedAt: null,
};

describe("ebook product page download modal", () => {
  it("uses the generic modal when the ebook is linked to a form", () => {
    const html = renderToStaticMarkup(
      <EbookInfo {...baseProps} formId="form-1" />,
    );

    expect(html).toContain("generic-download-modal");
  });

  it("passes the linked form content to the download modal", () => {
    const html = renderToStaticMarkup(
      <EbookInfo
        {...baseProps}
        formId="form-1"
        formContent={{
          id: "root",
          isContainer: true,
          type: "Root",
          properties: {
            submission: {
              onSuccess: { type: "toast", successMessage: "Ok" },
            },
          },
          children: [],
        }}
      />,
    );

    expect(html).toContain("generic-download-modal:0");
  });

  it("falls back to the minimum fields when the form has no builder content", () => {
    const html = renderToStaticMarkup(
      <EbookInfo {...baseProps} formId="form-1" formContent={null} />,
    );

    expect(html).toContain("generic-download-modal:no-content");
  });

  it("mounts no download modal when the free ebook has no linked form", () => {
    const html = renderToStaticMarkup(<EbookInfo {...baseProps} formId={null} />);

    expect(html).not.toContain("generic-download-modal");
  });

  it("only mounts a download modal for products acquired through a form", () => {
    const html = renderToStaticMarkup(
      <EbookInfo
        {...baseProps}
        acquisitionMode={ProductAcquisitionMode.PAID}
        formId="form-1"
      />,
    );

    expect(html).not.toContain("generic-download-modal");
  });
});
