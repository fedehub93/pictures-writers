// import { redirect } from "next/navigation";

// import { requireAdminAuth } from "@/lib/auth-utils";
// import { getFormSubmissionById } from "@/data/form";

// import { FormSubmissionViewer } from "@/modules/forms/viewer/ui/form-submission-viewer";

// const FormSubmissionIdPage = async (props: {
//   params: Promise<{ submissionId: string }>;
// }) => {
//   await requireAdminAuth();

//   const { submissionId } = await props.params;

//   const submission = await getFormSubmissionById(submissionId);

//   if (
//     !submission ||
//     !submission.id ||
//     !submission.form.content ||
//     !submission.data
//   ) {
//     redirect("/admin/submissions");
//   }

//   return (
//     <FormSubmissionViewer
//       rootInstance={submission.form.content}
//       submittedData={submission.data}
//     />
//   );
// };

// export default FormSubmissionIdPage;

import { Suspense } from "react";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchFormSubmissionById } from "@/modules/forms/submissions/server";

import {
  FormSubmissionIdView,
  FormSubmissionIdViewError,
  FormSubmissionIdViewLoading,
} from "@/modules/forms/submissions/ui/views/submission-id-view";

const FormSubmissionIdPage = async ({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) => {
  await requireAdminAuth();

  const { submissionId } = await params;

  prefetchFormSubmissionById(submissionId);

  return (
    <HydrateClient>
      <Suspense fallback={<FormSubmissionIdViewLoading />}>
        <ErrorBoundary fallback={<FormSubmissionIdViewError />}>
          <FormSubmissionIdView id={submissionId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default FormSubmissionIdPage;
