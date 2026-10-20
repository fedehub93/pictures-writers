import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function AudiencesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.AUDIENCES_READ);
  return children;
}
