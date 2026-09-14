-- Add missing submissions CRUD permissions
INSERT INTO "Permission" ("id", "key", "area", "action", "updatedAt")
VALUES
  ('permission:submissions.create', 'submissions.create', 'submissions', 'create', CURRENT_TIMESTAMP),
  ('permission:submissions.update', 'submissions.update', 'submissions', 'update', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Assign to ADMIN (all permissions)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role.key = 'ADMIN'
  AND permission.key IN ('submissions.create', 'submissions.update')
ON CONFLICT DO NOTHING;
