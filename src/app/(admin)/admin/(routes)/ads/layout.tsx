import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function AdsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.ADS_READ);
  return children;
}
