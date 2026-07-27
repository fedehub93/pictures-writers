"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/shared/ui/dialog";
import { EyeIcon } from "lucide-react";

import { FormRunner } from "../runner/form-runner";
import { useDesigner } from "../store/designer-provider";

import { FormActionResponse } from "@/actions/submit-form";

import type { FormRootInstance } from "../types/core";

export const PreviewBtn = ({
  id,
  gtmEventName,
  content,
}: {
  id: string;
  gtmEventName: string | null;
  content: FormRootInstance;
}) => {
  const root = useDesigner((state) => state.root);

  const onSubmit = async (
    values: Record<string, any>,
  ): Promise<FormActionResponse> => {
    return {
      success: true,
      message:
        root.properties.submission.onSuccess.type === "toast"
          ? root.properties.submission.onSuccess.successMessage
          : "Modulo inviato correttamente!",
    };
  };

  return (
    <Dialog>
      <DialogTrigger>
        <div className="flex gap-2 items-center py-2 text-sm font-medium px-3 rounded hover:bg-accent">
          <EyeIcon className="size-4" />
          Preview
        </div>
      </DialogTrigger>
      <DialogContent className="h-screen w-screen max-h-screen max-w-full flex flex-col grow p-0 gap-0 sm:rounded-none border-t-0 -mt-1">
        <div className="px-4 py-2 border-b">
          <p className="text-sm text-muted-foreground">Form preview</p>
          <p>This is how your form will look like to your users.</p>
        </div>
        <div className="bg-accent flex flex-col grow items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-155 flex flex-col gap-4 grow bg-background h-full w-full rounded p-8 overflow-y-auto">
            <FormRunner
              id={id}
              onSubmitHandler={onSubmit}
              content={content}
              gtmEventName={gtmEventName}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
