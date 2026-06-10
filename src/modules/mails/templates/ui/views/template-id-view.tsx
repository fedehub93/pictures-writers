"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { TemplateEditorForm } from "../components/template-editor-form";

import { useSuspenseTemplate } from "../../hooks/use-templates";

interface TemplateIdViewProps {
  templateId: string;
}

export const TemplateIdView = ({ templateId }: TemplateIdViewProps) => {
  const { data: template } = useSuspenseTemplate(templateId);
  return <TemplateEditorForm template={template} />;
};

export const TemplateIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Template"
      description="This may take a few seconds"
    />
  );
};

export const TemplateIdViewError = () => {
  return (
    <ErrorState title="Error Template" description="Something went wrong" />
  );
};
