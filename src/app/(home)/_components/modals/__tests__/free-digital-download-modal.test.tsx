import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { FormRootInstance } from "@/modules/forms/builder/types/core";
import { TextInputEnum } from "@/modules/forms/builder/types/properties";
import { DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT } from "@/modules/shop/products/lib/free-download-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@next/third-parties/google", () => ({
  sendGTMEvent: vi.fn(),
}));

vi.mock("@/shared/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { FreeDigitalDownloadModal } from "../free-digital-download-modal";

const baseProps = {
  rootId: "product-root-1",
  formId: "form-1",
  productSlug: "workbook-gratuito",
  title: "Workbook gratuito",
  imageCoverUrl: "",
  isOpen: true,
  setIsOpen: () => {},
};

describe("FreeDigitalDownloadModal", () => {
  it("renders the minimum lead-magnet fields from the linked form content", () => {
    const html = renderToStaticMarkup(
      <FreeDigitalDownloadModal {...baseProps} content={null} />,
    );

    expect(html).toContain("Email");
    expect(html).toContain("Pictures Writers.");
    expect(html).toContain("Scarica gratis");
  });

  it("renders the additional fields authored in a richer form", () => {
    const content: FormRootInstance = {
      ...DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT,
      children: [
        {
          id: "nome",
          isContainer: false,
          type: "TextField",
          properties: {
            name: "nome",
            label: "Come ti chiami?",
            helperText: "",
            placeholder: "",
            inputType: TextInputEnum.Text,
            validation: { required: false },
          },
        },
        ...DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT.children,
      ],
    };

    const html = renderToStaticMarkup(
      <FreeDigitalDownloadModal {...baseProps} content={content} />,
    );

    expect(html).toContain("Come ti chiami?");
    expect(html).toContain("Email");
  });
});
