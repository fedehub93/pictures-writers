import { redirect } from "next/navigation";

import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";
import { FormForm } from "./_components/form-form";

const FormIdPage = async (props: { params: Promise<{ formId: string }> }) => {
  await requireAdminAuth();

  const params = await props.params;

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
