import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";

import { type NavBadgeCounts } from "./nav-data";

/**
 * Badge values for the nav shell. The mail badge is only meaningful to users
 * who can open the inbox, so it is omitted entirely otherwise.
 */
export function getNavBadges(
  permissionKeys: readonly string[],
  totalUnread: number | undefined,
): NavBadgeCounts {
  if (!hasPermission(permissionKeys, PERMISSIONS.MAIL_READ)) {
    return {};
  }

  return { "mail-unread": totalUnread };
}
