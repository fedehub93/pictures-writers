import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function EmailSettingsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.EMAIL_SETTINGS_READ);
  return children;
}
