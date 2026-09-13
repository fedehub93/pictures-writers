import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function ProductCreateLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.PRODUCTS_CREATE);
  return children;
}
