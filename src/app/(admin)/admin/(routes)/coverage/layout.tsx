import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function CoverageLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.COVERAGE_READ);
  return children;
}
