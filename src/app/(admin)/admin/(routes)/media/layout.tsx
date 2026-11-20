import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function MediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission(PERMISSIONS.MEDIA_READ);
  return children;
}
