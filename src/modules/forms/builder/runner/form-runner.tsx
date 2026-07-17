"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/shared/ui/button";

import { generateFormSchema } from "../lib/generate-form-schema";
import { generateDefaultValues } from "../lib/generate-default-values";

import type { FormRootInstance } from "../types";
import { FormNodeRenderer } from "./form-node-renderer";

interface FormRunnerProps {
  root: FormRootInstance;
  onSubmit: (data: Record<string, any>) => void;
}

export const FormRunner = ({ root, onSubmit }: FormRunnerProps) => {
  const dynamicSchema = generateFormSchema(root);
  const defaultValues = generateDefaultValues(root);

  const methods = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: { ...defaultValues },
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="w-full gap-y-4 flex flex-col"
      >
        {root.children.map((node) => (
          <FormNodeRenderer key={node.id} node={node} />
        ))}

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={methods.formState.isSubmitting}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md"
          >
            {methods.formState.isSubmitting
              ? "Invio in corso..."
              : "Invia Form"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
