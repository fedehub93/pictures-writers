-- Add the site layout permission keys (spec: site regions).
-- The catalog is data-driven; ADMIN receives every action and EDITOR receives
-- the full surface in the initial seed (restrictable per Installation later).
INSERT INTO "Permission" ("id", "key", "area", "action", "updatedAt")
VALUES
  ('permission:site_layout.read', 'site_layout.read', 'site_layout', 'read', CURRENT_TIMESTAMP),
  ('permission:site_layout.update', 'site_layout.update', 'site_layout', 'update', CURRENT_TIMESTAMP),
  ('permission:site_layout.publish', 'site_layout.publish', 'site_layout', 'publish', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- ADMIN receives every action; EDITOR receives the full surface in the initial
-- seed (restrictable per Installation later).
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role.key IN ('ADMIN', 'EDITOR')
  AND permission.key IN (
    'site_layout.read',
    'site_layout.update',
    'site_layout.publish'
  )
ON CONFLICT DO NOTHING;
