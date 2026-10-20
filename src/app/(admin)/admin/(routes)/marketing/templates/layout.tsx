import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function TemplatesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.TEMPLATES_READ);
  return children;
}
