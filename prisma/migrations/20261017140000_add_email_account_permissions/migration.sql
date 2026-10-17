-- Add the email account permission keys (spec: email conversations).
-- The catalog is data-driven; the ADMIN role receives the new keys.
INSERT INTO "Permission" ("id", "key", "area", "action", "updatedAt")
VALUES
  ('permission:email-accounts.read', 'email-accounts.read', 'email-accounts', 'read', CURRENT_TIMESTAMP),
  ('permission:email-accounts.manage', 'email-accounts.manage', 'email-accounts', 'manage', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Assign to ADMIN (all permissions)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role.key = 'ADMIN'
  AND permission.key IN ('email-accounts.read', 'email-accounts.manage')
ON CONFLICT DO NOTHING;
