"use client";

import { DragDropProvider } from "@dnd-kit/react";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspenseForm } from "../../hooks/use-forms";

import { Designer, DesignerProvider } from "../../builder";
import { FormActions } from "../../builder/ui/actions";

interface FormBuilderViewProps {
  id: string;
}

export const FormBuilderView = ({ id }: FormBuilderViewProps) => {
  const { data } = useSuspenseForm(id);

  return (
    <DesignerProvider initialContent={data.content}>
      <DragDropProvider>
        <main className="flex flex-col size-full">
          <nav className="flex justify-between border-b p-4 gap-3 items-center">
            <h2>
              <span>Form: </span>
              {data.name}
            </h2>
            <FormActions id={id} />
          </nav>
          <div className="flex w-full grow items-center justify-center relative overflow-y-auto h-50 bg-accent">
            <Designer />
          </div>
        </main>
      </DragDropProvider>
    </DesignerProvider>
  );
};

export const FormBuilderViewLoading = () => {
  return (
    <LoadingState
      title="Loading Forms"
      description="This may take a few seconds"
    />
  );
};

export const FormBuilderViewError = () => {
  return <ErrorState title="Error Forms" description="Something went wrong" />;
};
