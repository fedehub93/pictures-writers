"use client";

import type { ReactNode } from "react";

import { FormActionResponse } from "@/actions/submit-form";
import type { FormRootInstance } from "../types/core";
import { RootFormComponent } from "../ui/layouts/root/form-component";

interface FormRunnerProps {
  /** The form the answer belongs to; public uploads are rate-limited per form. */
  formId: string;
  onSubmitHandler: (values: Record<string, any>) => Promise<FormActionResponse>;
  content: FormRootInstance;
  gtmEventName: string | null;
  footer?: ReactNode;
}

export const FormRunner = ({
  formId,
  onSubmitHandler,
  content,
  gtmEventName,
  footer,
}: FormRunnerProps) => {
  return (
    <RootFormComponent
      formId={formId}
      onSubmitHandler={onSubmitHandler}
      gtmEventName={gtmEventName}
      elementInstance={content}
      footer={footer}
    />
  );
};
