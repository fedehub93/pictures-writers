import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { EmailEditorForm } from "./_components/email-editor-form";

const EmailTemplateIdPage = async ({
  params,
}: {
  params: { templateId: string };
}) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const template = await db.emailTemplate.findUnique({
    where: {
      id: params.templateId,
    },
  });

  if (!template) {
    redirect("/admin/mails/templates");
  }

  return <EmailEditorForm template={template} />;
};

export default EmailTemplateIdPage;
