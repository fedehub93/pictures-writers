import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function FormsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.FORMS_READ);
  return children;
}
