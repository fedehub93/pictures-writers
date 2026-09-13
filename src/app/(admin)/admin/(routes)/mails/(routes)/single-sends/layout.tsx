import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function SingleSendsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.SINGLE_SENDS_READ);
  return children;
}
