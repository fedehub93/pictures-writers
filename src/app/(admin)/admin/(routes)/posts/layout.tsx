import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

export default async function PostsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.POSTS_READ);
  return children;
}
