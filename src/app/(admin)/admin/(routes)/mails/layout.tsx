import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function MailsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.MAIL_READ);
  return children;
}
