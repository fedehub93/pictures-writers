import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useTRPC } from "@/trpc/client";

import { CommandSelect } from "@/shared/components/command-select";

import { useFormFilters } from "@/modules/forms/hooks/use-forms-filter";

export const FormIdFilter = () => {
  const [filters, setFilters] = useFormFilters();

  const trpc = useTRPC();
  const [formSearch, setFormSearch] = useState("");

  const { data } = useQuery(
    trpc.forms.getMany.queryOptions({
      pageSize: 100,
      search: formSearch,
    }),
  );

  return (
    <CommandSelect
      placeholder="Form"
      className="h-8 px-2 lg:px-3"
      options={(data ?? []).map((form) => ({
        id: form.id,
        value: form.id,
        children: <div className="flex items-center gap-x-2">{form.name}</div>,
      }))}
      onSelect={(value) => setFilters({ formId: value })}
      onSearch={setFormSearch}
      value={filters.formId ?? ""}
    />
  );
};
