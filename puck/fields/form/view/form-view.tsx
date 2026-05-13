"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useFormsQuery } from "@/app/(admin)/_hooks/use-forms-query";
import { FormProps } from "@/puck/fields/form";

interface FormViewProps {
  state: FormProps;
  onUpdate: (values: FormProps) => void;
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
              onUpdate({ ...selectedForm });
            }
            if (!selectedForm) {
              onUpdate({
                id: "",
                name: "",
                fields: "",
                submitLabel: "",
                gtmEventName: "",
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
