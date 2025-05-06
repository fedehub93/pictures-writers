import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProductType, UserRole } from "@prisma/client";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { OrganizationForm } from "./_components/organization-form";
import { API_ADMIN_ORGANIZATIONS } from "@/constants/api";

const OrganizationIdPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const params = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const organization = await db.organization.findFirst({
    where: {
      id: params.id,
    },
  });

  if (!organization || !organization.id) {
    redirect("/admin/organizations");
  }

  return (
    <OrganizationForm
      initialData={organization}
      apiUrl={`${API_ADMIN_ORGANIZATIONS}/${organization.id}`}
    />
  );
};

export default OrganizationIdPage;
