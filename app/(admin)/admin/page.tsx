import { redirect } from "next/navigation";
import { requireAdminAuth } from "@/lib/auth-utils";

const AdminPage = async () => {
  await requireAdminAuth()

  redirect("/admin/dashboard")
};

export default AdminPage;
