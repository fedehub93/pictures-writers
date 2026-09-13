-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "roleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the system roles. The keys are stable so this migration is safe to replay.
INSERT INTO "Role" ("id", "key", "name", "isSystem", "updatedAt")
VALUES
  ('system-role-admin', 'ADMIN', 'Administrator', true, CURRENT_TIMESTAMP),
  ('system-role-editor', 'EDITOR', 'Editor', false, CURRENT_TIMESTAMP),
  ('system-role-user', 'USER', 'User', false, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "isSystem" = EXCLUDED."isSystem";

-- The catalog is intentionally data-driven: new authorization checks can use a stable key
-- without changing the database schema.
INSERT INTO "Permission" ("id", "key", "area", "action", "updatedAt")
SELECT 'permission:' || permission.key, permission.key, permission.area, permission.action, CURRENT_TIMESTAMP
FROM (VALUES
  ('dashboard.read', 'dashboard', 'read'),
  ('users.read', 'users', 'read'), ('users.create', 'users', 'create'), ('users.update', 'users', 'update'), ('users.delete', 'users', 'delete'), ('users.manage', 'users', 'manage'),
  ('roles.read', 'roles', 'read'), ('roles.manage', 'roles', 'manage'),
  ('posts.read', 'posts', 'read'), ('posts.create', 'posts', 'create'), ('posts.update', 'posts', 'update'), ('posts.delete', 'posts', 'delete'), ('posts.publish', 'posts', 'publish'),
  ('categories.read', 'categories', 'read'), ('categories.create', 'categories', 'create'), ('categories.update', 'categories', 'update'), ('categories.delete', 'categories', 'delete'), ('categories.publish', 'categories', 'publish'),
  ('tags.read', 'tags', 'read'), ('tags.create', 'tags', 'create'), ('tags.update', 'tags', 'update'), ('tags.delete', 'tags', 'delete'), ('tags.publish', 'tags', 'publish'),
  ('pages.read', 'pages', 'read'), ('pages.create', 'pages', 'create'), ('pages.update', 'pages', 'update'), ('pages.delete', 'pages', 'delete'), ('pages.publish', 'pages', 'publish'),
  ('products.read', 'products', 'read'), ('products.create', 'products', 'create'), ('products.update', 'products', 'update'), ('products.delete', 'products', 'delete'), ('products.publish', 'products', 'publish'),
  ('media.read', 'media', 'read'), ('media.create', 'media', 'create'), ('media.update', 'media', 'update'), ('media.delete', 'media', 'delete'),
  ('authors.read', 'authors', 'read'), ('reviews.read', 'reviews', 'read'), ('reviews.manage', 'reviews', 'manage'),
  ('product-categories.read', 'product-categories', 'read'), ('product-categories.create', 'product-categories', 'create'), ('product-categories.update', 'product-categories', 'update'), ('product-categories.delete', 'product-categories', 'delete'),
  ('submissions.read', 'submissions', 'read'), ('submissions.delete', 'submissions', 'delete'), ('coverage.read', 'coverage', 'read'), ('coverage.manage', 'coverage', 'manage'),
  ('audiences.read', 'audiences', 'read'), ('audiences.manage', 'audiences', 'manage'), ('contacts.read', 'contacts', 'read'), ('contacts.manage', 'contacts', 'manage'),
  ('templates.read', 'templates', 'read'), ('templates.manage', 'templates', 'manage'), ('single-sends.read', 'single-sends', 'read'), ('single-sends.manage', 'single-sends', 'manage'),
  ('email-settings.read', 'email-settings', 'read'), ('email-settings.manage', 'email-settings', 'manage'),
  ('settings.read', 'settings', 'read'), ('settings.update', 'settings', 'update'), ('widgets.read', 'widgets', 'read'), ('widgets.manage', 'widgets', 'manage'),
  ('ads.read', 'ads', 'read'), ('ads.manage', 'ads', 'manage'), ('campaigns.read', 'campaigns', 'read'), ('campaigns.manage', 'campaigns', 'manage'), ('ad-campaigns.read', 'ad-campaigns', 'read'), ('ad-campaigns.manage', 'ad-campaigns', 'manage'), ('ad-blocks.manage', 'ad-blocks', 'manage'), ('ad-items.manage', 'ad-items', 'manage'),
  ('languages.read', 'languages', 'read'), ('languages.manage', 'languages', 'manage'),
  ('forms.read', 'forms', 'read'), ('forms.manage', 'forms', 'manage'), ('mail.read', 'mail', 'read'), ('mail.manage', 'mail', 'manage')
) AS permission(key, area, action)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "Permission"."key" = permission.key);

-- ADMIN is the protected system role and receives the complete catalog.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role CROSS JOIN "Permission" permission
WHERE role.key = 'ADMIN'
ON CONFLICT DO NOTHING;

-- EDITOR receives the initial editorial surface, but not user or system management.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role.key = 'EDITOR'
  AND permission.area IN ('dashboard', 'posts', 'categories', 'tags', 'pages', 'products', 'media', 'authors')
ON CONFLICT DO NOTHING;

-- Existing users are assigned idempotently from their legacy enum role.
UPDATE "User" AS user_record
SET "roleId" = role.id
FROM "Role" AS role
WHERE role.key = user_record."role"::text
  AND (user_record."roleId" IS DISTINCT FROM role.id);
