import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ExtendedEmailEditor } from "./_components/extended-email-editor";
import { StatusView } from "@/components/content/status-view";
import { ContentIdActions } from "@/components/content/content-id-actions";
import { EmailTemplateActions } from "./_components/actions";
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
