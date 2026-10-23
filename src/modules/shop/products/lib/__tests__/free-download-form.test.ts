import { describe, expect, it } from "vitest";

import type { FormRootInstance } from "@/modules/forms/builder/types/core";
import { TextInputEnum } from "@/modules/forms/builder/types/properties";

import {
  DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT,
  extractFreeDigitalDownloadFields,
  removeFreeDigitalDownloadSubmitButtons,
  resolveFreeDigitalDownloadFormContent,
} from "../free-download-form";

describe("free download form content", () => {
  it("provides the minimum lead-magnet fields (email, privacy)", () => {
    const types =
      DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT.children.map(
        (node) => node.type,
      );

    expect(types).toEqual(["TextField", "CheckboxField"]);

    const [email, privacy] = DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT.children;

    expect(email).toMatchObject({
      type: "TextField",
      properties: {
        name: "email",
        inputType: TextInputEnum.Email,
        validation: { required: true },
      },
    });
    expect(privacy).toMatchObject({
      type: "CheckboxField",
      properties: {
        name: "privacyConsent",
        validation: { required: true },
      },
    });
  });

  it("falls back to the default content when a legacy form has none", () => {
    expect(resolveFreeDigitalDownloadFormContent(null)).toBe(
      DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT,
    );
    expect(
      resolveFreeDigitalDownloadFormContent({
        ...DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT,
        children: [],
      }),
    ).toBe(DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT);
  });

  it("keeps richer form content untouched when it already has the minimum fields", () => {
    const richContent: FormRootInstance = {
      ...DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT,
      children: [
        {
          id: "custom-name",
          isContainer: false,
          type: "TextField",
          properties: {
            name: "nome",
            label: "Nome",
            helperText: "",
            placeholder: "",
            inputType: TextInputEnum.Text,
            validation: { required: false },
          },
        },
        ...DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT.children,
      ],
    };

    expect(resolveFreeDigitalDownloadFormContent(richContent)).toBe(richContent);
  });

  it("adds the minimum fields to richer content that omits one", () => {
    const content: FormRootInstance = {
      ...DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT,
      children: [
        {
          id: "nome",
          isContainer: false,
          type: "TextField",
          properties: {
            name: "nome",
            label: "Nome",
            helperText: "",
            placeholder: "",
            inputType: TextInputEnum.Text,
            validation: { required: false },
          },
        },
        {
          id: "freelance",
          isContainer: false,
          type: "CheckboxField",
          properties: {
            name: "freelance",
            label: "Sono un freelance",
            helperText: "",
            validation: { required: false },
          },
        },
        {
          id: "submit",
          isContainer: false,
          type: "Button",
          properties: { label: "Invia" },
        },
      ],
    };

    const resolved = resolveFreeDigitalDownloadFormContent(content);

    expect(resolved.children.map((node) => node.id)).toEqual([
      "nome",
      "freelance",
      "submit",
      "free-download-email",
      "free-download-privacy",
    ]);
  });
});

describe("removeFreeDigitalDownloadSubmitButtons", () => {
  it("removes submit buttons so the modal can render its own footer", () => {
    const content = {
      ...DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT,
      children: [
        ...DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT.children,
        {
          id: "nested",
          isContainer: true as const,
          type: "Grid" as const,
          properties: { label: "Grid", columns: 2 },
          children: [
            {
              id: "nested-button",
              isContainer: false as const,
              type: "Button" as const,
              properties: { label: "Invia" },
            },
          ],
        },
      ],
    } satisfies FormRootInstance;

    const stripped = removeFreeDigitalDownloadSubmitButtons(content);

    expect(
      JSON.stringify(stripped).includes('"type":"Button"'),
    ).toBe(false);
    expect(stripped.children.some((node) => node.type === "Grid")).toBe(true);
  });

  it("keeps content without buttons untouched", () => {
    const content = DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT;

    expect(removeFreeDigitalDownloadSubmitButtons(content)).toBe(content);
  });
});

describe("extractFreeDigitalDownloadFields", () => {
  const content = DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT;

  it("reads the values produced by the standard fields", () => {
    expect(
      extractFreeDigitalDownloadFields(
        { email: " reader@example.com ", privacyConsent: true },
        content,
      ),
    ).toEqual({ email: "reader@example.com", privacyConsent: true });
  });

  it("detects fields whose names were generated from custom labels", () => {
    const renamed: FormRootInstance = {
      ...content,
      children: [
        {
          id: "renamed-email",
          isContainer: false,
          type: "TextField",
          properties: {
            name: "la_tua_email",
            label: "La tua email",
            helperText: "",
            placeholder: "",
            inputType: TextInputEnum.Text,
            validation: { required: true },
          },
        },
        {
          id: "renamed-consent",
          isContainer: false,
          type: "CheckboxField",
          properties: {
            name: "accetto_i_termini",
            label: "Accetto i termini",
            helperText: "",
            validation: { required: true },
          },
        },
      ],
    };

    expect(
      extractFreeDigitalDownloadFields(
        { la_tua_email: "reader@example.com", accetto_i_termini: true },
        renamed,
      ),
    ).toEqual({ email: "reader@example.com", privacyConsent: true });
  });

  it("reports missing consent and email instead of throwing", () => {
    expect(extractFreeDigitalDownloadFields({}, content)).toEqual({
      email: "",
      privacyConsent: false,
    });
  });
});
