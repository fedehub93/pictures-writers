import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function ProductCategoriesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.PRODUCT_CATEGORIES_READ);
  return children;
}
