"use client";

import { DragDropProvider } from "@dnd-kit/react";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { Button } from "@/shared/ui/button";

import { useSuspenseForm } from "../../hooks/use-forms";

import { Designer, DragOverlayWrapper } from "../../builder";

interface FormBuilderViewProps {
  id: string;
}

export const FormBuilderView = ({ id }: FormBuilderViewProps) => {
  const { data } = useSuspenseForm(id);

  return (
    <DragDropProvider>
      <main className="flex flex-col size-full">
        <nav className="flex justify-between border-b p-4 gap-3 items-center">
          <h2>
            <span>Form: </span>
            {data.name}
          </h2>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost">
              Preview
            </Button>
            {true === true && (
              <>
                <Button type="button" variant="ghost">
                  Save
                </Button>
                <Button type="button" variant="ghost">
                  Publish
                </Button>
              </>
            )}
          </div>
        </nav>
        <div className="flex w-full grow items-center justify-center relative overflow-y-auto h-50 bg-accent">
          <Designer />
        </div>
      </main>
      {/* <DragOverlayWrapper /> */}
    </DragDropProvider>
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
