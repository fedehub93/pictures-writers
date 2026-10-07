-- Add the missing product-categories.publish permission key (spec: shop refactor).
-- The catalog is data-driven; the ADMIN role receives the new key.
INSERT INTO "Permission" ("id", "key", "area", "action", "updatedAt")
VALUES
  ('permission:product-categories.publish', 'product-categories.publish', 'product-categories', 'publish', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Assign to ADMIN (all permissions)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role.key = 'ADMIN'
  AND permission.key = 'product-categories.publish'
ON CONFLICT DO NOTHING;
