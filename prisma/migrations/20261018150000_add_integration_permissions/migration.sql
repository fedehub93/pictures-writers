-- Add the integration permission keys (spec: admin integrations surface).
-- The catalog is data-driven; the ADMIN role receives the new keys.
INSERT INTO "Permission" ("id", "key", "area", "action", "updatedAt")
VALUES
  ('permission:integrations.read', 'integrations.read', 'integrations', 'read', CURRENT_TIMESTAMP),
  ('permission:integrations.manage', 'integrations.manage', 'integrations', 'manage', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Assign to ADMIN (all permissions)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role.key = 'ADMIN'
  AND permission.key IN ('integrations.read', 'integrations.manage')
ON CONFLICT DO NOTHING;
