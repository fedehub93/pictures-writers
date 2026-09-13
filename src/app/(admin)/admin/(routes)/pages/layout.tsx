import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function PagesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.PAGES_READ);
  return children;
}
