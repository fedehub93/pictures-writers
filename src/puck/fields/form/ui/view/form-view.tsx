"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useDebounceValue } from "usehooks-ts";

import { CommandSelect } from "@/shared/components/command-select";
import { Skeleton } from "@/shared/ui/skeleton";

import type { HydratedFormProps } from "@/puck/fields/form";

interface FormViewProps {
  state: HydratedFormProps;
  onUpdate: (values: HydratedFormProps) => void;
}

export const FormView = ({ state, onUpdate }: FormViewProps) => {
  const trpc = useTRPC();
  const [formSearch, setFormSearch] = useDebounceValue("", 300);

  const { data, isLoading } = useQuery({
    ...trpc.forms.getMany.queryOptions({
      pageSize: 100,
      search: formSearch,
    }),
    placeholderData: keepPreviousData, // Evita che 'data' diventi undefined durante le ricerche
  });

  // Se è il primissimo caricamento e non abbiamo ancora dati, mostriamo lo Skeleton
  if (isLoading && !data) {
    return <Skeleton className="w-full h-10" />;
  }

  return (
    <div className="flex flex-col space-y-2">
      <CommandSelect
        options={(data || []).map((form) => ({
          id: form.id,
          value: form.id,
          children: (
            <div className="flex items-center gap-x-2">
              <span>{form.name}</span>
            </div>
          ),
        }))}
        onSelect={(val) => {
          const selectedForm = data?.find((f) => f.id === val);
          if (selectedForm) {
            onUpdate({
              id: selectedForm.id,
              content: selectedForm.content,
              gtmEventName: selectedForm.gtmEventName,
            });
          } else {
            onUpdate({
              id: "",
              content: null,
              gtmEventName: null,
            });
          }
        }}
        onSearch={setFormSearch}
        value={state.id}
        placeholder="Select a form"
        className="w-full"
      />
      <div>Not found what you&apos;re looking for?</div>
    </div>
  );
};
