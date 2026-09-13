import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function TagsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.TAGS_READ);
  return children;
}
