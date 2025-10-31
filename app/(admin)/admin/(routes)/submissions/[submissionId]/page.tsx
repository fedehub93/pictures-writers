import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { SubmissionForm } from "./_components/submission-form";
import { getFormSubmissionById } from "@/data/form";

const FormSubmissionIdPage = async (props: {
  params: Promise<{ submissionId: string }>;
}) => {
  const { submissionId } = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const submission = await getFormSubmissionById(submissionId);

  if (!submission || !submission.id) {
    redirect("/admin/submissions");
  }

  return <SubmissionForm initialData={submission} />;
};

export default FormSubmissionIdPage;
