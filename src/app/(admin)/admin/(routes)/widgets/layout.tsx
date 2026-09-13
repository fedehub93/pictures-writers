import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function WidgetsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.WIDGETS_READ);
  return children;
}
