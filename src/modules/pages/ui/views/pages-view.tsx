"use client";

import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";

import { useSuspensePages } from "../../hooks/use-pages";
import { usePagesFilters } from "../../hooks/use-pages-filters";

import { DataTable } from "../components/data-table";
import { columns } from "../components/column";

import { CreatePageDialog } from "../components/create-page-dialog";
import { UpdatePageDialog } from "../components/settings/update-page-dialog";
import { DataPagination } from "@/shared/components/data-pagination";

export const PagesView = () => {
  const [filters, setFilters] = usePagesFilters();
  const { data } = useSuspensePages(filters);

  return (
    <>
      <CreatePageDialog />
      <UpdatePageDialog />
      <div className="px-6">
        <DataTable columns={columns} data={data.items} />
        <DataPagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
        />
      </div>
    </>
  );
};

export const PagesViewLoading = () => {
  return (
    <LoadingState
      title="Loading Forms"
      description="This may take a few seconds"
    />
  );
};

export const PagesViewError = () => {
  return <ErrorState title="Error Forms" description="Something went wrong" />;
};
