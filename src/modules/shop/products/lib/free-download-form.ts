import type {
  FormDisplayInstance,
  FormElementInstance,
  FormNodeDynamicInstance,
  FormRootInstance,
} from "@/modules/forms/builder/types/core";
import { getFlatFields } from "@/modules/forms/builder/helpers/get-flat-fields";
import { TextInputEnum } from "@/modules/forms/builder/types/properties";

const PRIVACY_POLICY_URL = "https://www.iubenda.com/privacy-policy/49078580";

const submitButton: FormDisplayInstance<"Button"> = {
  id: "free-download-submit",
  isContainer: false,
  type: "Button",
  properties: { label: "Scarica gratis" },
};

const emailField: FormElementInstance<"TextField"> = {
  id: "free-download-email",
  isContainer: false,
  type: "TextField",
  properties: {
    name: "email",
    label: "Email",
    helperText: "",
    placeholder: "mario.rossi@gmail.com",
    inputType: TextInputEnum.Email,
    validation: { required: true },
  },
};

const privacyField: FormElementInstance<"CheckboxField"> = {
  id: "free-download-privacy",
  isContainer: false,
  type: "CheckboxField",
  properties: {
    name: "privacyConsent",
    label: "Accetto la Privacy Policy",
    helperText: "",
    validation: { required: true },
    description: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Accetto la " },
            {
              type: "text",
              text: "Privacy Policy",
              marks: [{ type: "link", attrs: { href: PRIVACY_POLICY_URL } }],
            },
            { type: "text", text: " di Pictures Writers." },
          ],
        },
      ],
    },
  },
};

/**
 * Minimal builder content for lead-magnet forms that predate the visual field
 * renderer (the migration-created `free-ebook-download` form has no content).
 * It matches the fields the download action requires: an email and a consent.
 */
export const DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT: FormRootInstance = {
  id: "root",
  isContainer: true,
  type: "Root",
  properties: {
    submission: {
      onSuccess: {
        type: "toast",
        successMessage: "Controlla la tua email per scaricare il prodotto.",
      },
    },
  },
  children: [emailField, privacyField, submitButton],
};

const hasSubmitButton = (nodes: FormNodeDynamicInstance[]): boolean =>
  nodes.some(
    (node) =>
      (!node.isContainer && node.type === "Button") ||
      (node.isContainer && hasSubmitButton(node.children)),
  );

/**
 * Uses the linked form's builder content when it exists, and falls back to the
 * minimal email + privacy layout for legacy lead-magnet forms. Forms authored
 * without a submit button get one appended so they stay usable in the modal.
 */
export const resolveFreeDigitalDownloadFormContent = (
  content: FormRootInstance | null | undefined,
): FormRootInstance => {
  if (
    !content ||
    !Array.isArray(content.children) ||
    content.children.length === 0
  ) {
    return DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT;
  }

  if (hasSubmitButton(content.children)) {
    return content;
  }

  return { ...content, children: [...content.children, submitButton] };
};

interface FreeDigitalDownloadFields {
  email: string;
  privacyConsent: boolean;
}

const isEmailField = (field: ReturnType<typeof getFlatFields>[number]) =>
  field.type === "TextField" &&
  (field.properties.name === "email" ||
    field.properties.inputType === "email");

const isConsentField = (field: ReturnType<typeof getFlatFields>[number]) =>
  field.type === "CheckboxField" &&
  (field.properties.name === "privacyConsent" ||
    /privacy/i.test(`${field.properties.name} ${field.properties.label}`));

/**
 * Maps the values produced by `FormRunner` to the fields the download action
 * requires. Fields are detected by type and name so forms whose labels were
 * renamed by the builder (and therefore have a different generated `name`)
 * still work.
 */
export const extractFreeDigitalDownloadFields = (
  values: Record<string, unknown>,
  content: FormRootInstance,
): FreeDigitalDownloadFields => {
  const fields = getFlatFields(content.children);
  const emailField = fields.find(isEmailField);
  const consentField = fields.find(isConsentField);

  const email = values[emailField?.properties.name ?? "email"];
  const consent = values[consentField?.properties.name ?? "privacyConsent"];

  return {
    email: typeof email === "string" ? email.trim() : "",
    privacyConsent: consent === true,
  };
};
