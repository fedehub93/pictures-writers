import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function ContactsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.CONTACTS_READ);
  return children;
}
