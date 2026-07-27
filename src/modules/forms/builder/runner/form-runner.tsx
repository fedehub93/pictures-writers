"use client";

import { FormActionResponse } from "@/actions/submit-form";
import type { FormRootInstance } from "../types/core";
import { RootFormComponent } from "../ui/layouts/root/form-component";

interface FormRunnerProps {
  id: string;
  onSubmitHandler: (values: Record<string, any>) => Promise<FormActionResponse>;
  content: FormRootInstance;
  gtmEventName: string | null;
}

export const FormRunner = ({
  id,
  onSubmitHandler,
  content,
  gtmEventName,
}: FormRunnerProps) => {
  return (
    <RootFormComponent
      id={id}
      onSubmitHandler={onSubmitHandler}
      gtmEventName={gtmEventName}
      elementInstance={content}
    />
  );
};
