"use client";

import { createContext, useContext, type ReactNode } from "react";

const FormUploadContext = createContext<string | undefined>(undefined);

/**
 * The id of the form being answered. A public upload field is anonymous, so
 * the endpoint it calls is scoped to this form; the runner puts it in context
 * because the field itself is only handed its own properties.
 */
export function FormUploadProvider({
  formId,
  children,
}: {
  formId: string;
  children: ReactNode;
}) {
  return (
    <FormUploadContext.Provider value={formId}>
      {children}
    </FormUploadContext.Provider>
  );
}

export function useFormUploadFormId(): string | undefined {
  return useContext(FormUploadContext);
}
