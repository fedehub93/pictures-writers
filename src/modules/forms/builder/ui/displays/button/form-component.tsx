"use client";

import { Button } from "@/shared/ui/button";

import type { FormDisplayInstance } from "../../../types/core";

export function ButtonFormComponent({
  elementInstance,
}: {
  elementInstance: FormDisplayInstance<"Button">;
}) {
  const { label } = elementInstance.properties;

  return <Button type="submit" className="self-end">{label}</Button>;
}
