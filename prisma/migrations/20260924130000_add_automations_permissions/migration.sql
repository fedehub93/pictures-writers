-- Add the automations permission keys (spec: automations.read / automations.write).
-- The catalog is data-driven; the ADMIN role receives the new keys.
INSERT INTO "Permission" ("id", "key", "area", "action", "updatedAt")
VALUES
  ('permission:automations.read', 'automations.read', 'automations', 'read', CURRENT_TIMESTAMP),
  ('permission:automations.write', 'automations.write', 'automations', 'write', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Assign to ADMIN (all permissions)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role.key = 'ADMIN'
  AND permission.key IN ('automations.read', 'automations.write')
ON CONFLICT DO NOTHING;