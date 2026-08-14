"use client";

import { useFormContext, useFormState } from "react-hook-form";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/shared/ui/button";

import type { FormDisplayInstance } from "../../../types/core";

export function ButtonFormComponent({
  elementInstance,
}: {
  elementInstance: FormDisplayInstance<"Button">;
}) {
  const { control } = useFormContext();
  const { isSubmitting } = useFormState({ control });
  const { label } = elementInstance.properties;

  return (
    <Button type="submit" className="self-end">
      {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}
