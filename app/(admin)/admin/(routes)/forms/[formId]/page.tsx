import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { FormForm } from "./_components/form-form";

const FormIdPage = async (props: { params: Promise<{ formId: string }> }) => {
  const params = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const form = await db.form.findFirst({
    where: {
      id: params.formId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!form || !form.id) {
    redirect("/admin/categories");
  }

  return <FormForm initialData={form} apiUrl="/api/admin/forms" />;
};

export default FormIdPage;
