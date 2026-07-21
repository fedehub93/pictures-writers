"use client";

import type { FormRootInstance } from "../types/core";
import { RootFormComponent } from "../ui/layouts/root/form-component";

interface FormRunnerProps {
  id: string;
  content: FormRootInstance;
  gtmEventName: string | null;
}

export const FormRunner = ({ id, content, gtmEventName }: FormRunnerProps) => {
  return (
    <RootFormComponent
      id={id}
      gtmEventName={gtmEventName}
      elementInstance={content}
    />
  );
};
