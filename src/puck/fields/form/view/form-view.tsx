"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

import { useFormsQuery } from "@/app/(admin)/_hooks/use-forms-query";

import type { HydratedFormProps } from "@/puck/fields/form";

interface FormViewProps {
  state: HydratedFormProps;
  onUpdate: (values: HydratedFormProps) => void;
}

export const FormView = ({ state, onUpdate }: FormViewProps) => {
  const { data: forms, isLoading, isError } = useFormsQuery();
  if (isError) {
    return <div className="flex flex-col gap-2">Error fetching forms.</div>;
  }

  return (
    <div>
      {isLoading && <Skeleton className="w-full h-10" />}
      {forms && (
        <Select
          name="formId"
          value={state.id}
          onValueChange={(val) => {
            const selectedForm = forms.find((f) => f.id === val);
            if (selectedForm) {
              onUpdate({
                id: selectedForm.id,
                content: selectedForm.content,
                gtmEventName: selectedForm.gtmEventName,
              });
            }
            if (!selectedForm) {
              onUpdate({
                id: "",
                content: null,
                gtmEventName: null,
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a form..." />
          </SelectTrigger>
          <SelectContent>
            {forms.map((option) => {
              return (
                <SelectItem
                  key={option.name}
                  value={option.id}
                  className="w-full flex items-center justify-between"
                >
                  {option.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
