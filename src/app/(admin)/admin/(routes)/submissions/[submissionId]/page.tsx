import { redirect } from "next/navigation";

import { requireAdminAuth } from "@/lib/auth-utils";
import { getFormSubmissionById } from "@/data/form";

import { FormSubmissionViewer } from "@/modules/forms/viewer/ui/form-submission-viewer";

const FormSubmissionIdPage = async (props: {
  params: Promise<{ submissionId: string }>;
}) => {
  await requireAdminAuth();

  const { submissionId } = await props.params;

  const submission = await getFormSubmissionById(submissionId);

  if (
    !submission ||
    !submission.id ||
    !submission.form.content ||
    !submission.data
  ) {
    redirect("/admin/submissions");
  }

  return (
    <FormSubmissionViewer
      rootInstance={submission.form.content}
      submittedData={submission.data}
    />
  );
};

export default FormSubmissionIdPage;
