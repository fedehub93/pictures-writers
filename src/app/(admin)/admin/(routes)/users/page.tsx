import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/authorization";
import { UsersView } from "@/modules/users";

const UsersPage = async () => {
  await requirePermission(PERMISSIONS.USERS_READ);
  return <UsersView />;
};

export default UsersPage;
