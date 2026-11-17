import { describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

const SITE_LAYOUT_PERMISSIONS = [
  PERMISSIONS.SITE_LAYOUT_READ,
  PERMISSIONS.SITE_LAYOUT_UPDATE,
  PERMISSIONS.SITE_LAYOUT_PUBLISH,
];

describe("site layout permissions", () => {
  it("registers every permission key in the catalog", async () => {
    const permissions = await db.permission.findMany({
      where: { key: { in: SITE_LAYOUT_PERMISSIONS } },
    });

    expect(permissions.map(({ key }) => key).sort()).toEqual(
      [...SITE_LAYOUT_PERMISSIONS].sort(),
    );
  });

  it.each(["ADMIN", "EDITOR"])(
    "assigns every permission key to the %s role",
    async (roleKey) => {
      const role = await db.role.findUniqueOrThrow({
        where: { key: roleKey },
        include: { permissions: { include: { permission: true } } },
      });
      const keys = role.permissions.map(({ permission }) => permission.key);

      for (const key of SITE_LAYOUT_PERMISSIONS) {
        expect(keys).toContain(key);
      }
    },
  );
});
