// import { requireAdminAuth } from "@/lib/auth-utils";
// import { getFormSubmissionsByFilters } from "@/data/form";

// import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

// import { DataTable } from "./_components/data-table";
// import { columns } from "./_components/column";

// const FormSubmissionsPage = async () => {
//   await requireAdminAuth();

//   const forms = await getFormSubmissionsByFilters({ where: {} });

//   return (
//     <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
//       <ContentHeader label="Forms" totalEntries={forms.length} />
//       <DataTable columns={columns} data={forms} />
//     </div>
//   );
// };

// export default FormSubmissionsPage;

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchFormSubmissions } from "@/modules/forms/submissions/server";
import {
  FormSubmissionsView,
  FormSubmissionsViewError,
  FormSubmissionsViewLoading,
} from "@/modules/forms/submissions/ui/views/submissions-view";
import { loadSearchParams } from "@/modules/forms/submissions/params";
import { SubmissionsListHeader } from "@/modules/forms/submissions/ui/components/submissions-list-header";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Submissions = async ({ searchParams }: Props) => {
  await requireAdminAuth();

  const filters = await loadSearchParams(searchParams);

  prefetchFormSubmissions(filters);

  return (
    <>
      <SubmissionsListHeader />
      <HydrateClient>
        <Suspense fallback={<FormSubmissionsViewLoading />}>
          <ErrorBoundary fallback={<FormSubmissionsViewError />}>
            <FormSubmissionsView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default Submissions;
