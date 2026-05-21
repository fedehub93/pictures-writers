import { redirect } from "next/navigation";

import { requireAdminAuth } from "@/lib/auth-utils";
import { getFormSubmissionById } from "@/data/form";

import { SubmissionForm } from "./_components/submission-form";

const FormSubmissionIdPage = async (props: {
  params: Promise<{ submissionId: string }>;
}) => {
  await requireAdminAuth();

  const { submissionId } = await props.params;

  const submission = await getFormSubmissionById(submissionId);

  if (!submission || !submission.id) {
    redirect("/admin/submissions");
  }

  return <SubmissionForm initialData={submission} />;
};

export default FormSubmissionIdPage;
