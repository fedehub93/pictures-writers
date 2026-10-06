import { describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

describe("shop module foundation permissions", () => {
  it("registers the product-categories.publish key in the catalog", async () => {
    const permission = await db.permission.findUnique({
      where: { key: PERMISSIONS.PRODUCT_CATEGORIES_PUBLISH },
    });

    expect(permission).not.toBeNull();
    expect(permission?.area).toBe("product-categories");
    expect(permission?.action).toBe("publish");
  });

  it("assigns product-categories.publish to the ADMIN role", async () => {
    const admin = await db.role.findUniqueOrThrow({
      where: { key: "ADMIN" },
      include: { permissions: { include: { permission: true } } },
    });

    expect(
      admin.permissions.map(({ permission }) => permission.key),
    ).toContain(PERMISSIONS.PRODUCT_CATEGORIES_PUBLISH);
  });
});
