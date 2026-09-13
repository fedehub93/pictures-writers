import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/authorization";
import { RolesView } from "@/modules/roles";

export default async function RolesPage() {
  await requirePermission(PERMISSIONS.ROLES_READ);
  return <RolesView />;
}
