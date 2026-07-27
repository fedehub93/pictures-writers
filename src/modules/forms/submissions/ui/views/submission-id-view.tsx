"use client";

import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";

import { useSuspenseFormSubmission } from "../../hooks/use-submissions";
import { FormSubmissionViewer } from "@/modules/forms/viewer/ui/form-submission-viewer";

export const FormSubmissionIdView = ({ id }: { id: string }) => {
  const { data: submission } = useSuspenseFormSubmission(id);

  if (!submission.form.content || !submission.data)
    return <FormSubmissionIdViewError />;

  return (
    <FormSubmissionViewer
      rootInstance={submission.form.content}
      submittedData={submission.data}
    />
  );
};

export const FormSubmissionIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Submission"
      description="This may take a few seconds"
    />
  );
};

export const FormSubmissionIdViewError = () => {
  return (
    <ErrorState title="Error Submission" description="Something went wrong" />
  );
};
