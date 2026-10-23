import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const captured = vi.hoisted(() => ({
  onSubmit: undefined as
    | ((values: Record<string, unknown>) => Promise<unknown>)
    | undefined,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@next/third-parties/google", () => ({
  sendGTMEvent: vi.fn(),
}));

vi.mock("@/modules/forms/builder/runner/form-runner", () => ({
  FormRunner: (props: {
    onSubmitHandler: (values: Record<string, unknown>) => Promise<unknown>;
  }) => {
    captured.onSubmit = props.onSubmitHandler;
    return <div>form-runner</div>;
  },
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

vi.mock("@/app/(home)/_components/utils/captcha", () => ({
  getCaptchaToken: vi.fn(async () => "token"),
}));

vi.mock("@/modules/shop/products/lib/digital-download-submission", () => ({
  submitDigitalDownload: vi.fn(async () => ({
    success: true,
    message: "Check your email.",
  })),
}));

import { submitDigitalDownload } from "@/modules/shop/products/lib/digital-download-submission";

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

describe("FreeDigitalDownloadModal submission", () => {
  it("submits the values collected by the form runner to the download action", async () => {
    renderToStaticMarkup(<FreeDigitalDownloadModal {...baseProps} />);

    expect(captured.onSubmit).toBeDefined();

    const result = await captured.onSubmit!({
      email: " reader@example.com ",
      privacyConsent: true,
      nome: "Ada",
    });

    expect(result).toMatchObject({ success: true });
    expect(submitDigitalDownload).toHaveBeenCalledWith({
      values: {
        email: "reader@example.com",
        privacyConsent: true,
        nome: "Ada",
        rootId: "product-root-1",
      },
      recaptchaToken: "token",
      event: {
        event: "digital_download",
        product_id: "product-root-1",
        product_slug: "workbook-gratuito",
        product_name: "Workbook gratuito",
        form_id: "form-1",
        source: "product_detail_page",
      },
    });
  });
});
