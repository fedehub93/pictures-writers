-- Add the customers and orders permission keys (spec: order management).
-- The catalog is data-driven; the ADMIN role receives the new keys.
INSERT INTO "Permission" ("id", "key", "area", "action", "updatedAt")
VALUES
  ('permission:customers.read', 'customers.read', 'customers', 'read', CURRENT_TIMESTAMP),
  ('permission:customers.create', 'customers.create', 'customers', 'create', CURRENT_TIMESTAMP),
  ('permission:customers.update', 'customers.update', 'customers', 'update', CURRENT_TIMESTAMP),
  ('permission:customers.delete', 'customers.delete', 'customers', 'delete', CURRENT_TIMESTAMP),
  ('permission:orders.read', 'orders.read', 'orders', 'read', CURRENT_TIMESTAMP),
  ('permission:orders.create', 'orders.create', 'orders', 'create', CURRENT_TIMESTAMP),
  ('permission:orders.update', 'orders.update', 'orders', 'update', CURRENT_TIMESTAMP),
  ('permission:orders.delete', 'orders.delete', 'orders', 'delete', CURRENT_TIMESTAMP),
  ('permission:orders.manage', 'orders.manage', 'orders', 'manage', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Assign to ADMIN (all permissions)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role.key = 'ADMIN'
  AND permission.key IN (
    'customers.read',
    'customers.create',
    'customers.update',
    'customers.delete',
    'orders.read',
    'orders.create',
    'orders.update',
    'orders.delete',
    'orders.manage'
  )
ON CONFLICT DO NOTHING;
