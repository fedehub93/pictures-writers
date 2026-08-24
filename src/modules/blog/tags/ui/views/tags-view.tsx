"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useTagsFilters } from "../../hooks/use-tags-filters";
import { useSuspenseTags } from "../../hooks/use-tags";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreateTagDialog } from "../components/create-tag-dialog";

export const TagsView = () => {
  const [filters, _] = useTagsFilters();
  const { data } = useSuspenseTags(filters);
  return (
    <>
      <CreateTagDialog />
      <div className="px-6">
        <DataTable columns={columns} data={data} />
      </div>
    </>
  );
};

export const TagsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Tags"
      description="This may take a few seconds"
    />
  );
};

export const TagsViewError = () => {
  return <ErrorState title="Error Tags" description="Something went wrong" />;
};
