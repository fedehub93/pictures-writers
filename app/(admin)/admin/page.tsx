import { requireAdminAuth } from "@/lib/auth-utils";

const AdminPage = async () => {
  await requireAdminAuth()
};

export default AdminPage;
