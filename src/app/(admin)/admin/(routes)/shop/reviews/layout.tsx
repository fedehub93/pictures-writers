import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function ReviewsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.REVIEWS_READ);
  return children;
}
