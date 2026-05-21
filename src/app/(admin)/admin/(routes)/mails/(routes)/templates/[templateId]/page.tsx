import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { EmailEditorForm } from "./_components/email-editor-form";
import { requireAdminAuth } from "@/lib/auth-utils";

const EmailTemplateIdPage = async (props: {
  params: Promise<{ templateId: string }>;
}) => {
  await requireAdminAuth();
  
  const params = await props.params;

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
