import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

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
